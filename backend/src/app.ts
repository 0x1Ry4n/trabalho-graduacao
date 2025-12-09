import { HttpLoggerMiddleware, ErrorMiddleware } from './shared/middlewares/index.middleware';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { setupSwagger } from './config/swagger/swagger.setup';

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));
app.use(HttpLoggerMiddleware);
setupSwagger(app);
app.use(routes);
app.use(ErrorMiddleware);

export default app;