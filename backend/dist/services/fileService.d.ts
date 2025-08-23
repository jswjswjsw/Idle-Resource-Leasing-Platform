export declare const fileService: {
    uploadFile(data: {
        file: Express.Multer.File;
        type: "image" | "video" | "document";
        purpose: "resource" | "user" | "review";
    }): Promise<{
        url: string;
        fileName: string;
        originalName: string;
        size: number;
        type: string;
    }>;
    uploadMultipleFiles(files: Express.Multer.File[], type: "image" | "video" | "document", purpose: "resource" | "user" | "review"): Promise<{
        url: string;
        fileName: string;
        originalName: string;
        size: number;
        type: string;
    }[]>;
    deleteFile(fileUrl: string): Promise<{
        success: boolean;
    }>;
    uploadAvatar(file: Express.Multer.File, userId: string): Promise<{
        url: string;
        fileName: string;
        originalName: string;
        size: number;
        type: string;
    }>;
    generateUploadUrl(params: {
        fileName: string;
        fileType: string;
        purpose: string;
    }): Promise<{
        uploadUrl: string;
        fileUrl: string;
        fileName: string;
    }>;
    validateFileType(mimetype: string, allowedTypes: string[]): boolean;
    getFileInfo(fileUrl: string): Promise<{
        fileName: string;
        purpose: string;
        type: string;
        url: string;
    }>;
    deleteMultipleFiles(fileUrls: string[]): Promise<{
        success: boolean;
        deletedCount: number;
        failedCount: number;
        results: PromiseSettledResult<{
            success: boolean;
        }>[];
    }>;
    compressImage(imageUrl: string, options?: {
        width?: number;
        height?: number;
        quality?: number;
    }): Promise<{
        original: string;
        compressed: string;
    }>;
    getTemporaryUrl(fileUrl: string, expiresIn?: number): Promise<string>;
};
//# sourceMappingURL=fileService.d.ts.map