import { UserRole } from "../../shared/enums/user-role.enum";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                role: UserRole;
            };
            /**
             * Corpo cru da requisicao, preservado pelo `verify` do body-parser.
             *
             * A assinatura HMAC dos webhooks e calculada sobre os bytes
             * originais; reserializar o JSON ja parseado muda espacos e ordem de
             * chaves e invalida a verificacao.
             */
            rawBody?: Buffer;
        }
    }
}

export { };
