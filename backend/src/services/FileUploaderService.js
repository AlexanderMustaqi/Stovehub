import multer from 'multer';
import path from 'path';

/**
 * @class FileUploaderService
 * @description Encapsulates multer configuration for file uploads.
 */
class FileUploaderService {
    /**
     * @type {multer.Multer}
     */
    uploadRecipeImage;

    /**
     * @type {multer.Multer}
     */
    uploadPfp;

    constructor() {
        // Multer storage for recipe images
        const recipeImageStorage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, 'uploads/');
            },
            filename: (req, file, cb) => {
                cb(null, Date.now() + path.extname(file.originalname));
            }
        });
        this.uploadRecipeImage = multer({ storage: recipeImageStorage });

        // Multer storage for profile pictures (pfp)
        const pfpStorage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, 'uploads/pfp/');
            },
            filename: (req, file, cb) => {
                cb(null, `${Date.now()}${path.extname(file.originalname)}`);
            }
        });
        this.uploadPfp = multer({
            storage: pfpStorage,
            limits: { fileSize: 5 * 1024 * 1024 }, 
            fileFilter: (req, file, cb) => {
                if (file.mimetype.startsWith('image/')) {
                    cb(null, true);
                } else {
                    cb(new Error('Only image files are allowed!'), false);
                }
            }
        });
    }
}

export default FileUploaderService;
