import { PrismaClient, Prisma } from '@prisma/client';
export declare const prisma: PrismaClient<Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare function testDatabaseConnection(): Promise<boolean>;
export declare function disconnectDatabase(): Promise<void>;
export declare function checkDatabaseHealth(): Promise<{
    healthy: boolean;
    timestamp: string;
    error?: undefined;
} | {
    healthy: boolean;
    error: unknown;
    timestamp: string;
}>;
export declare function checkMigrationStatus(): Promise<{
    tables: any[];
    totalTables: number;
    timestamp: string;
    error?: undefined;
} | {
    error: unknown;
    timestamp: string;
    tables?: undefined;
    totalTables?: undefined;
}>;
export declare const extendedPrisma: import("@prisma/client/runtime/library").DynamicClientExtensionThis<Prisma.TypeMap<import("@prisma/client/runtime/library").InternalArgs & {
    result: {
        user: {
            fullName: () => {
                needs: {
                    username: true;
                };
                compute(user: any): any;
            };
        };
    };
    model: {
        user: {
            findByEmail: () => (email: string) => Promise<({
                paymentMethods: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    userId: string;
                    type: string;
                    isDefault: boolean;
                    details: string;
                    isValid: boolean;
                }[];
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
            } & {
                id: string;
                username: string;
                email: string;
                phone: string | null;
                password: string | null;
                avatar: string | null;
                creditScore: number;
                verified: boolean;
                isActive: boolean;
                lastLoginAt: Date | null;
                isOAuthUser: boolean;
                createdAt: Date;
                updatedAt: Date;
            }) | null>;
        };
        resource: {
            findAvailableResources: () => (filters?: any) => Promise<({
                category: {
                    id: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    description: string | null;
                    nameEn: string | null;
                    icon: string | null;
                    parentId: string | null;
                    sortOrder: number;
                };
                owner: {
                    id: string;
                    username: string;
                    email: string;
                    avatar: string | null;
                    creditScore: number;
                    verified: boolean;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                title: string;
                description: string;
                categoryId: string;
                price: Prisma.Decimal;
                priceUnit: string;
                images: string;
                location: string;
                latitude: number;
                longitude: number;
                status: string;
                rating: Prisma.Decimal;
                reviewCount: number;
                tags: string | null;
                ownerId: string;
                deposit: Prisma.Decimal;
            })[]>;
        };
    };
    query: {};
    client: {};
}, Prisma.PrismaClientOptions>, Prisma.TypeMapCb, {
    result: {
        user: {
            fullName: () => {
                needs: {
                    username: true;
                };
                compute(user: any): any;
            };
        };
    };
    model: {
        user: {
            findByEmail: () => (email: string) => Promise<({
                paymentMethods: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    userId: string;
                    type: string;
                    isDefault: boolean;
                    details: string;
                    isValid: boolean;
                }[];
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
            } & {
                id: string;
                username: string;
                email: string;
                phone: string | null;
                password: string | null;
                avatar: string | null;
                creditScore: number;
                verified: boolean;
                isActive: boolean;
                lastLoginAt: Date | null;
                isOAuthUser: boolean;
                createdAt: Date;
                updatedAt: Date;
            }) | null>;
        };
        resource: {
            findAvailableResources: () => (filters?: any) => Promise<({
                category: {
                    id: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    description: string | null;
                    nameEn: string | null;
                    icon: string | null;
                    parentId: string | null;
                    sortOrder: number;
                };
                owner: {
                    id: string;
                    username: string;
                    email: string;
                    avatar: string | null;
                    creditScore: number;
                    verified: boolean;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                title: string;
                description: string;
                categoryId: string;
                price: Prisma.Decimal;
                priceUnit: string;
                images: string;
                location: string;
                latitude: number;
                longitude: number;
                status: string;
                rating: Prisma.Decimal;
                reviewCount: number;
                tags: string | null;
                ownerId: string;
                deposit: Prisma.Decimal;
            })[]>;
        };
    };
    query: {};
    client: {};
}, {}>;
export type ExtendedPrismaClient = typeof extendedPrisma;
export { Prisma };
//# sourceMappingURL=database.d.ts.map