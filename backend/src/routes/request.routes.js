import { Router } from 'express';
import * as controller from '../controllers/request.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { uploadReceipt, verifyUploadedFile, cleanupUploadOnError } from '../middlewares/upload.js';
import { createRequestSchema, actionSchema, idParamSchema } from '../validators/request.validator.js';
import { ROLES as R } from '../config/constants.js';

const router = Router();

const idParam = validate(idParamSchema, 'params');
const actionBody = validate(actionSchema);

router.use(authenticate);

// Order matters: role gate -> multer -> magic-byte check -> field validation -> controller.
// cleanupUploadOnError deletes the saved file if anything after multer fails.
router.post(
  '/',
  authorize(R.REQUESTER),
  uploadReceipt,
  verifyUploadedFile,
  validate(createRequestSchema),
  controller.create,
  cleanupUploadOnError,
);

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.get('/:id/history', controller.history);
router.get('/:id/file', controller.file);

// authorize() is only a coarse gate; ownership and status rules live in workflow.service.
router.post('/:id/start-review', authorize(R.APPROVER), idParam, actionBody, controller.startReview);
router.post('/:id/forward', authorize(R.APPROVER), idParam, actionBody, controller.forward);
router.post('/:id/reject', authorize(R.APPROVER, R.FINAL_APPROVER), idParam, actionBody, controller.reject);
router.post('/:id/approve', authorize(R.FINAL_APPROVER), idParam, actionBody, controller.approve);
router.post('/:id/mark-paid', authorize(R.ACCOUNTING), idParam, actionBody, controller.markPaid);

export default router;