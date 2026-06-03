import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import publicRouter from "./public.js";
import adminRouter from "./admin.js";
import trackRouter from "./track.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(publicRouter);
router.use(adminRouter);
router.use(trackRouter);

export default router;
