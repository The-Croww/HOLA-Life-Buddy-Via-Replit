import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import moodRouter from "./mood";
import userRouter from "./user";
import chatRouter from "./chat";
import psychologistRouter from "./psychologist";
import tasksRouter from "./tasks";
import journalRouter from "./journal";
import adminFeaturesRouter from "./adminFeatures";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(moodRouter);
router.use(userRouter);
router.use(chatRouter);
router.use(psychologistRouter);
router.use(tasksRouter);
router.use(journalRouter);
router.use(adminFeaturesRouter);

export default router;
