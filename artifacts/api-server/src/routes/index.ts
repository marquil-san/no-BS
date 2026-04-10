import { Router, type IRouter } from "express";
import healthRouter from "./health";
import pipRouter from "./pip";

const router: IRouter = Router();

router.use(healthRouter);
router.use(pipRouter);

export default router;
