import { prisma } from '..//config/database';
import { cache, CACHE_KEYS } from '..//config/cache';
import { AppError } from '..//utils/errorHandler';

interface CreateOrderData {
  resourceId: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
  deliveryMethod: string;
  deliveryAddress?: string;
}

interface UpdateOrderData {
  status?: string;
  notes?: string;
  deliveryAddress?: string;
  deliveryFee?: number;
}

export class OrderService {

  // 创建订单
  async createOrder(renterId: string, data: CreateOrderData) {
    const { resourceId, startDate, endDate, notes, deliveryMethod, deliveryAddress } = data;

    return await this.prisma.$transaction(async (tx) => {
      // 验证资源是否存在且可用
      const resource = await tx.resource.findUnique({
        where: { id: resourceId },
        include: { owner: true }
      });

      if (!resource) {
        throw new AppError('资源不存在', 404);
      }

      if (resource.status !== 'AVAILABLE') {
        throw new AppError('该资源当前不可用', 400);
      }

      if (resource.ownerId === renterId) {
        throw new AppError('不能租赁自己的资源', 400);
      }

      // 验证日期
      if (startDate >= endDate) {
        throw new AppError('开始日期必须早于结束日期', 400);
      }

      if (startDate < new Date()) {
        throw new AppError('开始日期不能早于当前时间', 400);
      }

      // 检查时间冲突
      const conflictingOrders = await tx.order.findMany({
        where: {
          resourceId,
          status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
          OR: [
            {
              AND: [
                { startDate: { lte: startDate } },
                { endDate: { gte: startDate } }
              ]
            },
            {
              AND: [
                { startDate: { lte: endDate } },
                { endDate: { gte: endDate } }
              ]
            }
          ]
        }
      });

      if (conflictingOrders.length > 0) {
        throw new AppError('该时间段已被预订', 400);
      }

      // 计算价格
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalPrice = parseFloat((Number(resource.price) * daysDiff).toFixed(2));
      const deliveryFee = deliveryMethod === 'DELIVERY' ? 10 : 0;

      const order = await tx.order.create({
        data: {
          resourceId,
          renterId,
          ownerId: resource.ownerId,
          startDate,
          endDate,
          totalPrice: totalPrice + deliveryFee,
          deposit: resource.deposit || 0,
          notes,
          deliveryMethod: deliveryMethod as any,
          deliveryAddress,
          deliveryFee
        },
        include: {
          resource: {
            include: {
              owner: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  avatar: true,
                  creditScore: true,
                }
              },
              category: true
            }
          },
          renter: {
            select: {
              id: true,
              username: true,
              email: true,
              avatar: true,
              creditScore: true,
            }
          }
        }
      });

      // 更新资源状态为已预订
      await tx.resource.update({
        where: { id: resourceId },
        data: { status: 'RENTED' }
      });

      return order;
    });
  }

  // 获取订单列表
  async getOrders(userId: string, role: 'renter' | 'owner', page: number = 1, limit: number = 20, status?: string) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (role === 'renter') {
      where.renterId = userId;
    } else {
      where.ownerId = userId;
    }

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          resource: {
            include: {
              owner: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  avatar: true,
                  creditScore: true,
                }
              },
              category: true
            }
          },
          renter: {
            select: {
              id: true,
              username: true,
              email: true,
              avatar: true,
              creditScore: true,
            }
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              paymentMethod: true,
              createdAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where })
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // 获取单个订单详情
  async getOrder(id: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        resource: {
          include: {
            owner: {
              select: {
                id: true,
                username: true,
                email: true,
                avatar: true,
                creditScore: true,
              }
            },
            category: true
          }
        },
        renter: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
            creditScore: true,
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            paymentMethod: true,
            transactionId: true,
            createdAt: true
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      throw new AppError('订单不存在', 404);
    }

    // 验证用户权限
    if (order.renterId !== userId && order.ownerId !== userId) {
      throw new AppError('无权查看该订单', 403);
    }

    return order;
  }

  // 更新订单状态
  async updateOrderStatus(id: string, userId: string, status: string, notes?: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      select: { 
        status: true, 
        renterId: true, 
        ownerId: true,
        resourceId: true 
      }
    });

    if (!order) {
      throw new AppError('订单不存在', 404);
    }

    // 验证用户权限
    if (order.renterId !== userId && order.ownerId !== userId) {
      throw new AppError('无权操作该订单', 403);
    }

    // 状态转换验证
    const validTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['ACTIVE', 'CANCELLED'],
      ACTIVE: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
      DISPUTED: ['COMPLETED', 'CANCELLED']
    };

    if (!validTransitions[order.status]?.includes(status)) {
      throw new AppError(`无法从${order.status}状态转换到${status}状态`, 400);
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: status as any,
        notes: notes || undefined
      },
      include: {
        resource: {
          include: {
            owner: {
              select: {
                id: true,
                username: true,
                email: true,
                avatar: true,
                creditScore: true,
              }
            },
            category: true
          }
        },
        renter: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
            creditScore: true,
          }
        }
      }
    });

    // 如果订单完成，更新资源状态
    if (status === 'COMPLETED') {
      await prisma.resource.update({
        where: { id: order.resourceId },
        data: { status: 'AVAILABLE' }
      });
    }

    return updatedOrder;
  }

  // 确认订单（资源所有者操作）
  async confirmOrder(id: string, ownerId: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      select: { status: true, ownerId: true }
    });

    if (!order) {
      throw new AppError('订单不存在', 404);
    }

    if (order.ownerId !== ownerId) {
      throw new AppError('无权操作该订单', 403);
    }

    if (order.status !== 'PENDING') {
      throw new AppError('订单状态无效', 400);
    }

    return await this.updateOrderStatus(id, ownerId, 'CONFIRMED');
  }

  // 取消订单
  async cancelOrder(id: string, userId: string, reason?: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      select: { 
        status: true, 
        renterId: true, 
        ownerId: true,
        resourceId: true
      }
    });

    if (!order) {
      throw new AppError('订单不存在', 404);
    }

    if (order.renterId !== userId && order.ownerId !== userId) {
      throw new AppError('无权操作该订单', 403);
    }

    if (['COMPLETED', 'CANCELLED'].includes(order.status)) {
      throw new AppError('订单已完成或已取消，无法再次取消', 400);
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason || undefined
      },
      include: {
        resource: true,
        renter: true,
        owner: true
      }
    });

    // 恢复资源状态为可用
    await prisma.resource.update({
      where: { id: order.resourceId },
      data: { status: 'AVAILABLE' }
    });

    return updatedOrder;
  }

  // 完成订单
  async completeOrder(id: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      select: { 
        status: true, 
        renterId: true, 
        ownerId: true,
        resourceId: true,
        endDate: true
      }
    });

    if (!order) {
      throw new AppError('订单不存在', 404);
    }

    if (order.renterId !== userId && order.ownerId !== userId) {
      throw new AppError('无权操作该订单', 403);
    }

    if (order.status !== 'ACTIVE') {
      throw new AppError('订单状态无效', 400);
    }

    if (new Date() < order.endDate) {
      throw new AppError('订单尚未到期，无法完成', 400);
    }

    return await this.updateOrderStatus(id, userId, 'COMPLETED');
  }

  // 获取即将到期的订单
  async getUpcomingOrders(userId: string, days: number = 7) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { renterId: userId },
          { ownerId: userId }
        ],
        status: 'ACTIVE',
        endDate: {
          lte: endDate
        }
      },
      include: {
        resource: {
          include: {
            category: true
          }
        },
        renter: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
          }
        },
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
          }
        }
      },
      orderBy: { endDate: 'asc' }
    });

    return orders;
  }

  // 获取订单统计
  async getOrderStats(userId: string, role: 'renter' | 'owner') {
    const where: any = {};
    
    if (role === 'renter') {
      where.renterId = userId;
    } else {
      where.ownerId = userId;
    }

    const [totalOrders, pendingOrders, activeOrders, completedOrders, cancelledOrders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.count({ where: { ...where, status: 'PENDING' } }),
      prisma.order.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.order.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.order.count({ where: { ...where, status: 'CANCELLED' } })
    ]);

    const totalRevenue = await prisma.order.aggregate({
      where: { ...where, status: 'COMPLETED' },
      _sum: { totalPrice: true }
    });

    return {
      totalOrders,
      pendingOrders,
      activeOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue: totalRevenue._sum.totalPrice || 0
    };
  }
}

export const orderService = new OrderService();