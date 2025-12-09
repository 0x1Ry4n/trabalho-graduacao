import { Router } from "express";
import authRoutes from "./modules/auth/auth.route";
import userRoutes from './modules/users/user.route';
import studentRoutes from './modules/students/student.route';
import driverRoutes from "./modules/drivers/driver.route";
import collegeRoutes from './modules/colleges/college.route';
import enrollmentRoutes from "./modules/enrollments/enrollment.route";
import accountReceivableRoutes from "./modules/account_receivable/account_receivable.route";
import vehicleRoutes from "./modules/vehicles/vehicle.route";
import stopRoutes from "./modules/stops/stop.route";
import routeRoutes from "./modules/routes/route.route";
import routeStopRoutes from "./modules/route_stops/route-stop.route";
import studentRouteRoutes from "./modules/student_routes/student-route.route";
import auditRoutes from "./modules/audit/audit.route";
import uploadRoutes from './shared/routes/upload.route';

const routes = Router();

routes.use(authRoutes);
routes.use(userRoutes);
routes.use(collegeRoutes);
routes.use(studentRoutes);
routes.use(driverRoutes);
routes.use(enrollmentRoutes);
routes.use(accountReceivableRoutes);
routes.use(vehicleRoutes);
routes.use(stopRoutes);
routes.use(routeRoutes);
routes.use(routeStopRoutes);
routes.use(studentRouteRoutes);
routes.use(auditRoutes);
routes.use(uploadRoutes);

export default routes;