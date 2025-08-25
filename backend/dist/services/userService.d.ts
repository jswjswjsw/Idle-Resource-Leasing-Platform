interface CreateUserData {
    username: string;
    email: string;
    phone: string;
    password: string;
}
interface UpdateUserData {
    username?: string;
    phone?: string;
    avatar?: string;
}
export declare class UserService {
    private prisma;
    createUser(data: CreateUserData): Promise<{
        id: string;
        username: string;
        email: string;
        phone: string | null;
        avatar: string | null;
        creditScore: number;
        verified: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    loginUser(email: string, password: string): Promise<{
        token: string;
        refreshToken: string;
        user: {
            id: string;
            username: string;
            email: string;
            phone: string | null;
            avatar: string | null;
            creditScore: number;
            verified: boolean;
            addresses: {
                address: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                latitude: number | null;
                longitude: number | null;
                userId: string;
                label: string;
                isDefault: boolean;
            }[];
            paymentMethods: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                type: string;
                userId: string;
                isDefault: boolean;
                details: string;
                isValid: boolean;
            }[];
        };
    }>;
    getUserById(userId: string): Promise<any>;
    updateUser(userId: string, data: UpdateUserData): Promise<{
        id: string;
        username: string;
        email: string;
        phone: string | null;
        avatar: string | null;
        creditScore: number;
        verified: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateCreditScore(userId: string, scoreChange: number): Promise<{
        id: string;
        creditScore: number;
    }>;
    getCreditScore(userId: string): Promise<number>;
    getUserStats(userId: string): Promise<{
        totalResources: number;
        totalOrdersAsRenter: number;
        totalOrdersAsOwner: number;
        averageRating: number;
    }>;
    validatePassword(userId: string, password: string): Promise<boolean>;
    updatePassword(userId: string, newPassword: string): Promise<void>;
    refreshToken(refreshToken: string): Promise<{
        token: string;
        refreshToken: string;
    }>;
    sendEmailVerificationCode(email: string): Promise<boolean>;
    verifyEmail(email: string, code: string): Promise<boolean>;
    sendSmsVerificationCode(phone: string): Promise<boolean>;
    verifyPhone(phone: string, code: string): Promise<boolean>;
    sendPasswordResetEmail(email: string): Promise<boolean>;
    resetPassword(email: string, token: string, newPassword: string): Promise<boolean>;
    deactivateUser(userId: string): Promise<void>;
    getUserResources(userId: string): Promise<({
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
        _count: {
            orders: number;
            reviews: number;
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
    })[]>;
    getUserOrders(userId: string): Promise<({
        resource: {
            owner: {
                id: string;
                username: string;
                avatar: string | null;
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
            avatar: string | null;
        };
        payments: {
            paymentMethod: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            orderId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            refundAmount: import("@prisma/client/runtime/library").Decimal | null;
            metadata: string | null;
            currency: string;
            paymentGateway: string;
            transactionId: string | null;
            paidAt: Date | null;
            refundedAt: Date | null;
            refundReason: string | null;
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
    })[]>;
    findUserByPhone(phone: string): Promise<{
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
    } | null>;
    createUserByPhone(data: {
        phone: string;
        username: string;
        email?: string | null;
    }): Promise<{
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
    }>;
    generateTokens(userId: string): Promise<{
        token: string;
        refreshToken: string;
    }>;
}
export declare const userService: UserService;
export {};
//# sourceMappingURL=userService.d.ts.map