interface CreateOrderData {
    resourceId: string;
    startDate: Date;
    endDate: Date;
    notes?: string;
    deliveryMethod: string;
    deliveryAddress?: string;
}
export declare class OrderService {
    createOrder(renterId: string, data: CreateOrderData): Promise<any>;
    getOrders(userId: string, role: 'renter' | 'owner', page?: number, limit?: number, status?: string): Promise<{
        data: ({
            resource: {
                category: {
                    id: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    description: string | null;
                    sortOrder: number;
                    nameEn: string | null;
                    icon: string | null;
                    parentId: string | null;
                };
                owner: {
                    id: string;
                    username: string;
                    email: string;
                    avatar: string | null;
                    creditScore: number;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                title: string;
                description: string;
                categoryId: string;
                price: import("@prisma/client/runtime/library").Decimal;
                priceUnit: string;
                images: string;
                location: string;
                latitude: number;
                longitude: number;
                status: string;
                rating: import("@prisma/client/runtime/library").Decimal;
                reviewCount: number;
                tags: string | null;
                ownerId: string;
                deposit: import("@prisma/client/runtime/library").Decimal;
            };
            renter: {
                id: string;
                username: string;
                email: string;
                avatar: string | null;
                creditScore: number;
            };
            payments: {
                paymentMethod: string;
                id: string;
                createdAt: Date;
                status: string;
                amount: import("@prisma/client/runtime/library").Decimal;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            ownerId: string;
            deposit: import("@prisma/client/runtime/library").Decimal;
            renterId: string;
            resourceId: string;
            startDate: Date;
            endDate: Date;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
            paymentStatus: string;
            notes: string | null;
            deliveryMethod: string;
            deliveryAddress: string | null;
            deliveryFee: import("@prisma/client/runtime/library").Decimal;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getOrder(id: string, userId: string): Promise<{
        resource: {
            category: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                sortOrder: number;
                nameEn: string | null;
                icon: string | null;
                parentId: string | null;
            };
            owner: {
                id: string;
                username: string;
                email: string;
                avatar: string | null;
                creditScore: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            description: string;
            categoryId: string;
            price: import("@prisma/client/runtime/library").Decimal;
            priceUnit: string;
            images: string;
            location: string;
            latitude: number;
            longitude: number;
            status: string;
            rating: import("@prisma/client/runtime/library").Decimal;
            reviewCount: number;
            tags: string | null;
            ownerId: string;
            deposit: import("@prisma/client/runtime/library").Decimal;
        };
        renter: {
            id: string;
            username: string;
            email: string;
            avatar: string | null;
            creditScore: number;
        };
        payments: {
            paymentMethod: string;
            id: string;
            createdAt: Date;
            status: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            transactionId: string | null;
        }[];
        messages: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            orderId: string;
            content: string;
            senderId: string;
            receiverId: string;
            isRead: boolean;
            metadata: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        ownerId: string;
        deposit: import("@prisma/client/runtime/library").Decimal;
        renterId: string;
        resourceId: string;
        startDate: Date;
        endDate: Date;
        totalPrice: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: string;
        notes: string | null;
        deliveryMethod: string;
        deliveryAddress: string | null;
        deliveryFee: import("@prisma/client/runtime/library").Decimal;
    }>;
    updateOrderStatus(id: string, userId: string, status: string, notes?: string): Promise<{
        resource: {
            category: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                sortOrder: number;
                nameEn: string | null;
                icon: string | null;
                parentId: string | null;
            };
            owner: {
                id: string;
                username: string;
                email: string;
                avatar: string | null;
                creditScore: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            description: string;
            categoryId: string;
            price: import("@prisma/client/runtime/library").Decimal;
            priceUnit: string;
            images: string;
            location: string;
            latitude: number;
            longitude: number;
            status: string;
            rating: import("@prisma/client/runtime/library").Decimal;
            reviewCount: number;
            tags: string | null;
            ownerId: string;
            deposit: import("@prisma/client/runtime/library").Decimal;
        };
        renter: {
            id: string;
            username: string;
            email: string;
            avatar: string | null;
            creditScore: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        ownerId: string;
        deposit: import("@prisma/client/runtime/library").Decimal;
        renterId: string;
        resourceId: string;
        startDate: Date;
        endDate: Date;
        totalPrice: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: string;
        notes: string | null;
        deliveryMethod: string;
        deliveryAddress: string | null;
        deliveryFee: import("@prisma/client/runtime/library").Decimal;
    }>;
    confirmOrder(id: string, ownerId: string): Promise<{
        resource: {
            category: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                sortOrder: number;
                nameEn: string | null;
                icon: string | null;
                parentId: string | null;
            };
            owner: {
                id: string;
                username: string;
                email: string;
                avatar: string | null;
                creditScore: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            description: string;
            categoryId: string;
            price: import("@prisma/client/runtime/library").Decimal;
            priceUnit: string;
            images: string;
            location: string;
            latitude: number;
            longitude: number;
            status: string;
            rating: import("@prisma/client/runtime/library").Decimal;
            reviewCount: number;
            tags: string | null;
            ownerId: string;
            deposit: import("@prisma/client/runtime/library").Decimal;
        };
        renter: {
            id: string;
            username: string;
            email: string;
            avatar: string | null;
            creditScore: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        ownerId: string;
        deposit: import("@prisma/client/runtime/library").Decimal;
        renterId: string;
        resourceId: string;
        startDate: Date;
        endDate: Date;
        totalPrice: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: string;
        notes: string | null;
        deliveryMethod: string;
        deliveryAddress: string | null;
        deliveryFee: import("@prisma/client/runtime/library").Decimal;
    }>;
    cancelOrder(id: string, userId: string, reason?: string): Promise<{
        resource: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            description: string;
            categoryId: string;
            price: import("@prisma/client/runtime/library").Decimal;
            priceUnit: string;
            images: string;
            location: string;
            latitude: number;
            longitude: number;
            status: string;
            rating: import("@prisma/client/runtime/library").Decimal;
            reviewCount: number;
            tags: string | null;
            ownerId: string;
            deposit: import("@prisma/client/runtime/library").Decimal;
        };
        owner: {
            password: string | null;
            id: string;
            username: string;
            email: string;
            phone: string | null;
            avatar: string | null;
            creditScore: number;
            verified: boolean;
            isActive: boolean;
            lastLoginAt: Date | null;
            isOAuthUser: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        renter: {
            password: string | null;
            id: string;
            username: string;
            email: string;
            phone: string | null;
            avatar: string | null;
            creditScore: number;
            verified: boolean;
            isActive: boolean;
            lastLoginAt: Date | null;
            isOAuthUser: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        ownerId: string;
        deposit: import("@prisma/client/runtime/library").Decimal;
        renterId: string;
        resourceId: string;
        startDate: Date;
        endDate: Date;
        totalPrice: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: string;
        notes: string | null;
        deliveryMethod: string;
        deliveryAddress: string | null;
        deliveryFee: import("@prisma/client/runtime/library").Decimal;
    }>;
    completeOrder(id: string, userId: string): Promise<{
        resource: {
            category: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                sortOrder: number;
                nameEn: string | null;
                icon: string | null;
                parentId: string | null;
            };
            owner: {
                id: string;
                username: string;
                email: string;
                avatar: string | null;
                creditScore: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            description: string;
            categoryId: string;
            price: import("@prisma/client/runtime/library").Decimal;
            priceUnit: string;
            images: string;
            location: string;
            latitude: number;
            longitude: number;
            status: string;
            rating: import("@prisma/client/runtime/library").Decimal;
            reviewCount: number;
            tags: string | null;
            ownerId: string;
            deposit: import("@prisma/client/runtime/library").Decimal;
        };
        renter: {
            id: string;
            username: string;
            email: string;
            avatar: string | null;
            creditScore: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        ownerId: string;
        deposit: import("@prisma/client/runtime/library").Decimal;
        renterId: string;
        resourceId: string;
        startDate: Date;
        endDate: Date;
        totalPrice: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: string;
        notes: string | null;
        deliveryMethod: string;
        deliveryAddress: string | null;
        deliveryFee: import("@prisma/client/runtime/library").Decimal;
    }>;
    getUpcomingOrders(userId: string, days?: number): Promise<({
        resource: {
            category: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                sortOrder: number;
                nameEn: string | null;
                icon: string | null;
                parentId: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            description: string;
            categoryId: string;
            price: import("@prisma/client/runtime/library").Decimal;
            priceUnit: string;
            images: string;
            location: string;
            latitude: number;
            longitude: number;
            status: string;
            rating: import("@prisma/client/runtime/library").Decimal;
            reviewCount: number;
            tags: string | null;
            ownerId: string;
            deposit: import("@prisma/client/runtime/library").Decimal;
        };
        owner: {
            id: string;
            username: string;
            email: string;
            avatar: string | null;
        };
        renter: {
            id: string;
            username: string;
            email: string;
            avatar: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        ownerId: string;
        deposit: import("@prisma/client/runtime/library").Decimal;
        renterId: string;
        resourceId: string;
        startDate: Date;
        endDate: Date;
        totalPrice: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: string;
        notes: string | null;
        deliveryMethod: string;
        deliveryAddress: string | null;
        deliveryFee: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    getOrderStats(userId: string, role: 'renter' | 'owner'): Promise<{
        totalOrders: number;
        pendingOrders: number;
        activeOrders: number;
        completedOrders: number;
        cancelledOrders: number;
        totalRevenue: number | import("@prisma/client/runtime/library").Decimal;
    }>;
}
export declare const orderService: OrderService;
export {};
//# sourceMappingURL=orderService.d.ts.map