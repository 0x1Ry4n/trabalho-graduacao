import { z } from 'zod';
import { userLoginSchema } from '../../modules/auth/auth.schema';
import { userRegistrationSchema, userUpdateSchema } from '../../modules/users/user.schema';
import { studentRegistrationSchema, studentUpdateSchema, cardValidationRegistrationSchema } from '../../modules/students/student.schema';
import { driverRegistrationSchema, driverUpdateSchema } from '../../modules/drivers/driver.schema';
import { collegeRegistrationSchema, collegeUpdateSchema } from '../../modules/colleges/college.schema';
import { enrollmentRegistrationSchema, enrollmentUpdateSchema } from '../../modules/enrollments/enrollment.schema';
import { accountReceivableRegistrationSchema, accountReceivableUpdateSchema, priceTableRegistrationSchema, priceTableUpdateSchema } from '../../modules/account_receivable/account_receivable.schema';
import { vehicleRegistrationSchema, vehicleUpdateSchema } from '../../modules/vehicles/vehicle.schema';
import { stopRegistrationSchema, stopUpdateSchema } from '../../modules/stops/stop.schema';
import { routeRegistrationSchema, routeUpdateSchema } from '../../modules/routes/route.schema';
import { routeStopRegistrationSchema, routeStopUpdateSchema } from '../../modules/route_stops/route-stop.schema';
import { studentRouteRegistrationSchema, studentRouteUpdateSchema } from '../../modules/student_routes/student-route.schema';

function toSchema(zodSchema: z.ZodType): Record<string, unknown> {
    const result = z.toJSONSchema(zodSchema, { target: 'openApi3', unrepresentable: 'any' }) as Record<string, unknown>;
    const { $schema, ...schema } = result;
    return schema;
}

const errorResponse = {
    type: 'object',
    properties: {
        ok: { type: 'boolean', example: false },
        message: { type: 'string' },
        errors: { type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } },
    },
};

const idParam = {
    name: 'id',
    in: 'path' as const,
    required: true,
    schema: { type: 'integer' },
};

const paginationParams = [
    { name: 'page', in: 'query' as const, schema: { type: 'integer', default: 1 }, description: 'Número da página' },
    { name: 'pageSize', in: 'query' as const, schema: { type: 'integer', default: 10 }, description: 'Registros por página (1-100)' },
];

const bearerSecurity = [{ bearerAuth: [] }];

export const swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'Trabalho de Graduação - API',
        version: '1.0.0',
        description: 'API para gerenciamento de transporte universitário',
    },
    servers: [{ url: '/api', description: 'Servidor local' }],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
        schemas: {
            LoginBody: toSchema(userLoginSchema),
            CreateUserBody: toSchema(userRegistrationSchema),
            UpdateUserBody: toSchema(userUpdateSchema),
            CreateStudentBody: toSchema(studentRegistrationSchema),
            UpdateStudentBody: toSchema(studentUpdateSchema),
            CreateCardValidationBody: toSchema(cardValidationRegistrationSchema),
            CreateDriverBody: toSchema(driverRegistrationSchema),
            UpdateDriverBody: toSchema(driverUpdateSchema),
            CreateCollegeBody: toSchema(collegeRegistrationSchema),
            UpdateCollegeBody: toSchema(collegeUpdateSchema),
            CreateEnrollmentBody: toSchema(enrollmentRegistrationSchema),
            UpdateEnrollmentBody: toSchema(enrollmentUpdateSchema),
            CreateAccountReceivableBody: toSchema(accountReceivableRegistrationSchema),
            UpdateAccountReceivableBody: toSchema(accountReceivableUpdateSchema),
            CreatePriceTableBody: toSchema(priceTableRegistrationSchema),
            UpdatePriceTableBody: toSchema(priceTableUpdateSchema),
            CreateVehicleBody: toSchema(vehicleRegistrationSchema),
            UpdateVehicleBody: toSchema(vehicleUpdateSchema),
            CreateStopBody: toSchema(stopRegistrationSchema),
            UpdateStopBody: toSchema(stopUpdateSchema),
            CreateRouteBody: toSchema(routeRegistrationSchema),
            UpdateRouteBody: toSchema(routeUpdateSchema),
            CreateRouteStopBody: toSchema(routeStopRegistrationSchema),
            UpdateRouteStopBody: toSchema(routeStopUpdateSchema),
            CreateStudentRouteBody: toSchema(studentRouteRegistrationSchema),
            UpdateStudentRouteBody: toSchema(studentRouteUpdateSchema),
            ErrorResponse: errorResponse,
            ValidationError: {
                type: 'object',
                properties: {
                    ok: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Validation error' },
                    errors: { type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } },
                },
            },
        },
    },
    paths: {
        '/login': {
            post: {
                tags: ['Auth'],
                summary: 'Realiza login e retorna tokens JWT',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginBody' } } } },
                responses: {
                    200: { description: 'Login realizado com sucesso' },
                    400: { description: 'Credenciais inválidas', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
                    422: { description: 'Erro de validação', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
                },
            },
        },
        '/refresh': {
            post: {
                tags: ['Auth'],
                summary: 'Renova o access token usando o refresh token',
                security: bearerSecurity,
                responses: {
                    200: { description: 'Token renovado com sucesso' },
                    401: { description: 'Não autorizado' },
                },
            },
        },
        '/logout': {
            post: {
                tags: ['Auth'],
                summary: 'Realiza logout e invalida o refresh token',
                security: bearerSecurity,
                responses: {
                    204: { description: 'Logout realizado com sucesso' },
                    401: { description: 'Não autorizado' },
                },
            },
        },
        '/users': {
            post: {
                tags: ['Users'],
                summary: 'Cria um novo usuário',
                security: bearerSecurity,
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateUserBody' } } } },
                responses: {
                    201: { description: 'Usuário criado com sucesso' },
                    400: { description: 'Dados inválidos' },
                    422: { description: 'Erro de validação', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
                },
            },
            get: {
                tags: ['Users'],
                summary: 'Lista todos os usuários',
                security: bearerSecurity,
                responses: { 200: { description: 'Lista de usuários' } },
            },
        },
        '/users/paginated': {
            get: {
                tags: ['Users'],
                summary: 'Lista usuários com filtros e paginação',
                security: bearerSecurity,
                parameters: [
                    ...paginationParams,
                    { name: 'username', in: 'query' as const, schema: { type: 'string' } },
                    { name: 'email', in: 'query' as const, schema: { type: 'string' } },
                    { name: 'role', in: 'query' as const, schema: { type: 'string', enum: ['ADMIN', 'DRIVER', 'STUDENT'] } },
                    { name: 'active', in: 'query' as const, schema: { type: 'integer', enum: [0, 1] } },
                ],
                responses: { 200: { description: 'Lista paginada de usuários' } },
            },
        },
        '/users/{id}': {
            get: {
                tags: ['Users'],
                summary: 'Busca usuário por ID',
                security: bearerSecurity,
                parameters: [idParam],
                responses: { 200: { description: 'Usuário encontrado' }, 400: { description: 'Não encontrado' } },
            },
            patch: {
                tags: ['Users'],
                summary: 'Atualiza um usuário',
                security: bearerSecurity,
                parameters: [idParam],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateUserBody' } } } },
                responses: { 200: { description: 'Usuário atualizado' }, 422: { description: 'Erro de validação' } },
            },
        },
        '/students': {
            post: {
                tags: ['Students'],
                summary: 'Cria um novo estudante',
                security: bearerSecurity,
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateStudentBody' } } } },
                responses: { 201: { description: 'Estudante criado' }, 422: { description: 'Erro de validação' } },
            },
            get: {
                tags: ['Students'],
                summary: 'Lista todos os estudantes',
                security: bearerSecurity,
                responses: { 200: { description: 'Lista de estudantes' } },
            },
        },
        '/students/paginated': {
            get: {
                tags: ['Students'],
                summary: 'Lista estudantes com filtros e paginação',
                security: bearerSecurity,
                parameters: [
                    ...paginationParams,
                    { name: 'name', in: 'query' as const, schema: { type: 'string' } },
                    { name: 'cpf', in: 'query' as const, schema: { type: 'string' } },
                    { name: 'email', in: 'query' as const, schema: { type: 'string' } },
                    { name: 'city', in: 'query' as const, schema: { type: 'string' } },
                    { name: 'active', in: 'query' as const, schema: { type: 'integer', enum: [0, 1] } },
                ],
                responses: { 200: { description: 'Lista paginada de estudantes' } },
            },
        },
        '/students/{id}': {
            get: {
                tags: ['Students'],
                summary: 'Busca estudante por ID',
                security: bearerSecurity,
                parameters: [idParam],
                responses: { 200: { description: 'Estudante encontrado' }, 400: { description: 'Não encontrado' } },
            },
            patch: {
                tags: ['Students'],
                summary: 'Atualiza um estudante',
                security: bearerSecurity,
                parameters: [idParam],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateStudentBody' } } } },
                responses: { 200: { description: 'Estudante atualizado' } },
            },
        },
        '/students/{id}/activate': {
            patch: {
                tags: ['Students'],
                summary: 'Ativa um estudante',
                security: bearerSecurity,
                parameters: [idParam],
                responses: { 204: { description: 'Estudante ativado' } },
            },
        },
        '/students/{id}/inactivate': {
            patch: {
                tags: ['Students'],
                summary: 'Inativa um estudante',
                security: bearerSecurity,
                parameters: [idParam],
                responses: { 204: { description: 'Estudante inativado' } },
            },
        },
        '/students/{id}/cardValidations': {
            get: {
                tags: ['Students'],
                summary: 'Lista validações de cartão de um estudante',
                security: bearerSecurity,
                parameters: [idParam],
                responses: { 200: { description: 'Lista de validações' } },
            },
            post: {
                tags: ['Students'],
                summary: 'Registra uma validação de cartão',
                security: bearerSecurity,
                parameters: [idParam],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateCardValidationBody' } } } },
                responses: { 201: { description: 'Validação registrada' } },
            },
        },
        '/students/{id}/cardValidations/paginated': {
            get: {
                tags: ['Students'],
                summary: 'Lista paginada de validações de cartão de um estudante',
                security: bearerSecurity,
                parameters: [idParam, ...paginationParams],
                responses: { 200: { description: 'Lista paginada de validações' } },
            },
        },
        '/drivers': {
            post: {
                tags: ['Drivers'],
                summary: 'Cria um novo motorista',
                security: bearerSecurity,
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateDriverBody' } } } },
                responses: { 201: { description: 'Motorista criado' }, 422: { description: 'Erro de validação' } },
            },
            get: {
                tags: ['Drivers'],
                summary: 'Lista todos os motoristas',
                security: bearerSecurity,
                responses: { 200: { description: 'Lista de motoristas' } },
            },
        },
        '/drivers/paginated': {
            get: {
                tags: ['Drivers'],
                summary: 'Lista motoristas com filtros e paginação',
                security: bearerSecurity,
                parameters: [
                    ...paginationParams,
                    { name: 'name', in: 'query' as const, schema: { type: 'string' } },
                    { name: 'cpf', in: 'query' as const, schema: { type: 'string' } },
                    { name: 'city', in: 'query' as const, schema: { type: 'string' } },
                ],
                responses: { 200: { description: 'Lista paginada de motoristas' } },
            },
        },
        '/drivers/{id}': {
            get: {
                tags: ['Drivers'],
                summary: 'Busca motorista por ID',
                security: bearerSecurity,
                parameters: [idParam],
                responses: { 200: { description: 'Motorista encontrado' }, 400: { description: 'Não encontrado' } },
            },
            patch: {
                tags: ['Drivers'],
                summary: 'Atualiza um motorista',
                security: bearerSecurity,
                parameters: [idParam],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateDriverBody' } } } },
                responses: { 200: { description: 'Motorista atualizado' } },
            },
        },
        '/drivers/{id}/activate': {
            patch: {
                tags: ['Drivers'],
                summary: 'Ativa um motorista',
                security: bearerSecurity,
                parameters: [idParam],
                responses: { 204: { description: 'Motorista ativado' } },
            },
        },
        '/drivers/{id}/inactivate': {
            patch: {
                tags: ['Drivers'],
                summary: 'Inativa um motorista',
                security: bearerSecurity,
                parameters: [idParam],
                responses: { 204: { description: 'Motorista inativado' } },
            },
        },
        '/colleges': {
            post: {
                tags: ['Colleges'],
                summary: 'Cria uma nova instituição de ensino',
                security: bearerSecurity,
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateCollegeBody' } } } },
                responses: { 201: { description: 'Instituição criada' }, 422: { description: 'Erro de validação' } },
            },
            get: {
                tags: ['Colleges'],
                summary: 'Lista todas as instituições',
                security: bearerSecurity,
                responses: { 200: { description: 'Lista de instituições' } },
            },
        },
        '/colleges/paginated': {
            get: {
                tags: ['Colleges'],
                summary: 'Lista instituições com filtros e paginação',
                security: bearerSecurity,
                parameters: [
                    ...paginationParams,
                    { name: 'name', in: 'query' as const, schema: { type: 'string' } },
                    { name: 'city', in: 'query' as const, schema: { type: 'string' } },
                ],
                responses: { 200: { description: 'Lista paginada de instituições' } },
            },
        },
        '/colleges/{id}': {
            get: {
                tags: ['Colleges'],
                summary: 'Busca instituição por ID',
                security: bearerSecurity,
                parameters: [idParam],
                responses: { 200: { description: 'Instituição encontrada' }, 400: { description: 'Não encontrada' } },
            },
            patch: {
                tags: ['Colleges'],
                summary: 'Atualiza uma instituição',
                security: bearerSecurity,
                parameters: [idParam],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateCollegeBody' } } } },
                responses: { 200: { description: 'Instituição atualizada' } },
            },
        },
        '/colleges/{id}/activate': {
            patch: {
                tags: ['Colleges'],
                summary: 'Ativa uma instituição',
                security: bearerSecurity,
                parameters: [idParam],
                responses: { 204: { description: 'Instituição ativada' } },
            },
        },
        '/colleges/{id}/inactivate': {
            patch: {
                tags: ['Colleges'],
                summary: 'Inativa uma instituição',
                security: bearerSecurity,
                parameters: [idParam],
                responses: { 204: { description: 'Instituição inativada' } },
            },
        },
        '/enrollments': {
            post: {
                tags: ['Enrollments'],
                summary: 'Cria uma nova matrícula',
                security: bearerSecurity,
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateEnrollmentBody' } } } },
                responses: { 201: { description: 'Matrícula criada' }, 422: { description: 'Erro de validação' } },
            },
            get: {
                tags: ['Enrollments'],
                summary: 'Lista todas as matrículas',
                security: bearerSecurity,
                responses: { 200: { description: 'Lista de matrículas' } },
            },
        },
        '/enrollments/paginated': {
            get: {
                tags: ['Enrollments'],
                summary: 'Lista matrículas com filtros e paginação',
                security: bearerSecurity,
                parameters: [
                    ...paginationParams,
                    { name: 'studentId', in: 'query' as const, schema: { type: 'integer' } },
                    { name: 'status', in: 'query' as const, schema: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] } },
                ],
                responses: { 200: { description: 'Lista paginada de matrículas' } },
            },
        },
        '/enrollments/{id}': {
            get: {
                tags: ['Enrollments'],
                summary: 'Busca matrícula por ID',
                security: bearerSecurity,
                parameters: [idParam],
                responses: { 200: { description: 'Matrícula encontrada' }, 400: { description: 'Não encontrada' } },
            },
            patch: {
                tags: ['Enrollments'],
                summary: 'Atualiza uma matrícula',
                security: bearerSecurity,
                parameters: [idParam],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateEnrollmentBody' } } } },
                responses: { 200: { description: 'Matrícula atualizada' } },
            },
        },
        '/accounts-receivable': {
            post: {
                tags: ['AccountReceivable'],
                summary: 'Cria uma nova conta a receber',
                security: bearerSecurity,
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateAccountReceivableBody' } } } },
                responses: { 201: { description: 'Conta criada' } },
            },
            get: {
                tags: ['AccountReceivable'],
                summary: 'Lista todas as contas a receber',
                security: bearerSecurity,
                responses: { 200: { description: 'Lista de contas' } },
            },
        },
        '/accounts-receivable/paginated': {
            get: {
                tags: ['AccountReceivable'],
                summary: 'Lista contas a receber com filtros e paginação',
                security: bearerSecurity,
                parameters: [
                    ...paginationParams,
                    { name: 'status', in: 'query' as const, schema: { type: 'string', enum: ['OPEN', 'PAID'] } },
                    { name: 'payerId', in: 'query' as const, schema: { type: 'integer' } },
                ],
                responses: { 200: { description: 'Lista paginada de contas' } },
            },
        },
        '/accounts-receivable/{id}': {
            get: {
                tags: ['AccountReceivable'],
                summary: 'Busca conta a receber por ID',
                security: bearerSecurity,
                parameters: [idParam],
                responses: { 200: { description: 'Conta encontrada' }, 400: { description: 'Não encontrada' } },
            },
            patch: {
                tags: ['AccountReceivable'],
                summary: 'Atualiza uma conta a receber',
                security: bearerSecurity,
                parameters: [idParam],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateAccountReceivableBody' } } } },
                responses: { 200: { description: 'Conta atualizada' } },
            },
        },
        '/price-table': {
            post: {
                tags: ['AccountReceivable'],
                summary: 'Cria uma nova tabela de preços',
                security: bearerSecurity,
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreatePriceTableBody' } } } },
                responses: { 201: { description: 'Tabela de preços criada' } },
            },
            get: {
                tags: ['AccountReceivable'],
                summary: 'Lista tabela de preços',
                security: bearerSecurity,
                responses: { 200: { description: 'Tabela de preços' } },
            },
        },
        '/price-table/{id}': {
            patch: {
                tags: ['AccountReceivable'],
                summary: 'Atualiza tabela de preços',
                security: bearerSecurity,
                parameters: [idParam],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdatePriceTableBody' } } } },
                responses: { 200: { description: 'Tabela atualizada' } },
            },
        },
        '/vehicles': {
            post: {
                tags: ['Vehicles'],
                summary: 'Cria um novo veículo',
                security: bearerSecurity,
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateVehicleBody' } } } },
                responses: { 201: { description: 'Veículo criado' }, 422: { description: 'Erro de validação' } },
            },
            get: {
                tags: ['Vehicles'],
                summary: 'Lista todos os veículos',
                security: bearerSecurity,
                responses: { 200: { description: 'Lista de veículos' } },
            },
        },
        '/vehicles/paginated': {
            get: {
                tags: ['Vehicles'],
                summary: 'Lista veículos com filtros e paginação',
                security: bearerSecurity,
                parameters: [
                    ...paginationParams,
                    { name: 'model', in: 'query' as const, schema: { type: 'string' } },
                    { name: 'plate', in: 'query' as const, schema: { type: 'string' } },
                    { name: 'capacity', in: 'query' as const, schema: { type: 'integer' } },
                    { name: 'active', in: 'query' as const, schema: { type: 'integer', enum: [0, 1] } },
                ],
                responses: { 200: { description: 'Lista paginada de veículos' } },
            },
        },
        '/vehicles/{id}': {
            get: {
                tags: ['Vehicles'],
                summary: 'Busca veículo por ID',
                security: bearerSecurity,
                parameters: [idParam],
                responses: { 200: { description: 'Veículo encontrado' }, 400: { description: 'Não encontrado' } },
            },
            patch: {
                tags: ['Vehicles'],
                summary: 'Atualiza um veículo',
                security: bearerSecurity,
                parameters: [idParam],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateVehicleBody' } } } },
                responses: { 200: { description: 'Veículo atualizado' } },
            },
        },
        '/stops': {
            post: {
                tags: ['Stops'],
                summary: 'Cria uma nova parada',
                security: bearerSecurity,
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateStopBody' } } } },
                responses: { 201: { description: 'Parada criada' }, 422: { description: 'Erro de validação' } },
            },
            get: {
                tags: ['Stops'],
                summary: 'Lista todas as paradas',
                security: bearerSecurity,
                responses: { 200: { description: 'Lista de paradas' } },
            },
        },
        '/stops/paginated': {
            get: {
                tags: ['Stops'],
                summary: 'Lista paradas com filtros e paginação',
                security: bearerSecurity,
                parameters: [
                    ...paginationParams,
                    { name: 'name', in: 'query' as const, schema: { type: 'string' } },
                    { name: 'city', in: 'query' as const, schema: { type: 'string' } },
                    { name: 'neighborhood', in: 'query' as const, schema: { type: 'string' } },
                ],
                responses: { 200: { description: 'Lista paginada de paradas' } },
            },
        },
        '/stops/{id}': {
            get: {
                tags: ['Stops'],
                summary: 'Busca parada por ID',
                security: bearerSecurity,
                parameters: [idParam],
                responses: { 200: { description: 'Parada encontrada' }, 400: { description: 'Não encontrada' } },
            },
            patch: {
                tags: ['Stops'],
                summary: 'Atualiza uma parada',
                security: bearerSecurity,
                parameters: [idParam],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateStopBody' } } } },
                responses: { 200: { description: 'Parada atualizada' } },
            },
            delete: {
                tags: ['Stops'],
                summary: 'Remove uma parada',
                security: bearerSecurity,
                parameters: [idParam],
                responses: { 204: { description: 'Parada removida' } },
            },
        },
        '/routes': {
            post: {
                tags: ['Routes'],
                summary: 'Cria uma nova rota',
                security: bearerSecurity,
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateRouteBody' } } } },
                responses: { 201: { description: 'Rota criada' }, 422: { description: 'Erro de validação' } },
            },
            get: {
                tags: ['Routes'],
                summary: 'Lista todas as rotas',
                security: bearerSecurity,
                responses: { 200: { description: 'Lista de rotas' } },
            },
        },
        '/routes/paginated': {
            get: {
                tags: ['Routes'],
                summary: 'Lista rotas com filtros e paginação',
                security: bearerSecurity,
                parameters: [
                    ...paginationParams,
                    { name: 'name', in: 'query' as const, schema: { type: 'string' } },
                    { name: 'vehicleId', in: 'query' as const, schema: { type: 'integer' } },
                    { name: 'driverId', in: 'query' as const, schema: { type: 'integer' } },
                    { name: 'active', in: 'query' as const, schema: { type: 'integer', enum: [0, 1] } },
                ],
                responses: { 200: { description: 'Lista paginada de rotas' } },
            },
        },
        '/routes/{id}': {
            get: {
                tags: ['Routes'],
                summary: 'Busca rota por ID',
                security: bearerSecurity,
                parameters: [idParam],
                responses: { 200: { description: 'Rota encontrada' }, 400: { description: 'Não encontrada' } },
            },
            patch: {
                tags: ['Routes'],
                summary: 'Atualiza uma rota',
                security: bearerSecurity,
                parameters: [idParam],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateRouteBody' } } } },
                responses: { 200: { description: 'Rota atualizada' } },
            },
            delete: {
                tags: ['Routes'],
                summary: 'Remove uma rota (soft delete)',
                security: bearerSecurity,
                parameters: [idParam],
                responses: { 204: { description: 'Rota removida' } },
            },
        },
        '/routes/{id}/activate': {
            patch: {
                tags: ['Routes'],
                summary: 'Ativa uma rota',
                security: bearerSecurity,
                parameters: [idParam],
                responses: { 204: { description: 'Rota ativada' } },
            },
        },
        '/routes/{id}/inactivate': {
            patch: {
                tags: ['Routes'],
                summary: 'Inativa uma rota',
                security: bearerSecurity,
                parameters: [idParam],
                responses: { 204: { description: 'Rota inativada' } },
            },
        },
        '/routes/{routeId}/stops': {
            get: {
                tags: ['RouteStops'],
                summary: 'Lista todas as paradas de uma rota em ordem',
                security: bearerSecurity,
                parameters: [{ name: 'routeId', in: 'path' as const, required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Paradas da rota em ordem' } },
            },
        },
        '/routes/{routeId}/students': {
            get: {
                tags: ['StudentRoutes'],
                summary: 'Lista todos os estudantes de uma rota',
                security: bearerSecurity,
                parameters: [{ name: 'routeId', in: 'path' as const, required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Estudantes da rota' } },
            },
        },
        '/route-stops': {
            post: {
                tags: ['RouteStops'],
                summary: 'Adiciona uma parada a uma rota',
                security: bearerSecurity,
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateRouteStopBody' } } } },
                responses: { 201: { description: 'Parada adicionada à rota' }, 422: { description: 'Erro de validação' } },
            },
        },
        '/route-stops/paginated': {
            get: {
                tags: ['RouteStops'],
                summary: 'Lista paradas de rotas com filtros e paginação',
                security: bearerSecurity,
                parameters: [
                    ...paginationParams,
                    { name: 'routeId', in: 'query' as const, schema: { type: 'integer' } },
                    { name: 'stopId', in: 'query' as const, schema: { type: 'integer' } },
                ],
                responses: { 200: { description: 'Lista paginada de paradas nas rotas' } },
            },
        },
        '/route-stops/{id}': {
            get: {
                tags: ['RouteStops'],
                summary: 'Busca parada de rota por ID',
                security: bearerSecurity,
                parameters: [idParam],
                responses: { 200: { description: 'Parada de rota encontrada' }, 400: { description: 'Não encontrada' } },
            },
            patch: {
                tags: ['RouteStops'],
                summary: 'Atualiza ordem ou tempo estimado de uma parada na rota',
                security: bearerSecurity,
                parameters: [idParam],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateRouteStopBody' } } } },
                responses: { 200: { description: 'Parada de rota atualizada' } },
            },
            delete: {
                tags: ['RouteStops'],
                summary: 'Remove uma parada de uma rota',
                security: bearerSecurity,
                parameters: [idParam],
                responses: { 204: { description: 'Parada removida da rota' } },
            },
        },
        '/student-routes': {
            post: {
                tags: ['StudentRoutes'],
                summary: 'Vincula um estudante a uma rota',
                security: bearerSecurity,
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateStudentRouteBody' } } } },
                responses: { 201: { description: 'Estudante vinculado à rota' }, 422: { description: 'Erro de validação' } },
            },
        },
        '/student-routes/paginated': {
            get: {
                tags: ['StudentRoutes'],
                summary: 'Lista vínculos estudante-rota com filtros e paginação',
                security: bearerSecurity,
                parameters: [
                    ...paginationParams,
                    { name: 'studentId', in: 'query' as const, schema: { type: 'integer' } },
                    { name: 'routeId', in: 'query' as const, schema: { type: 'integer' } },
                    { name: 'routeStopId', in: 'query' as const, schema: { type: 'integer' } },
                    { name: 'routePeriod', in: 'query' as const, schema: { type: 'string', enum: ['MORNING', 'AFTERNOON', 'NIGHT'] } },
                    { name: 'active', in: 'query' as const, schema: { type: 'integer', enum: [0, 1] } },
                ],
                responses: { 200: { description: 'Lista paginada de vínculos' } },
            },
        },
        '/student-routes/{id}': {
            get: {
                tags: ['StudentRoutes'],
                summary: 'Busca vínculo estudante-rota por ID',
                security: bearerSecurity,
                parameters: [idParam],
                responses: { 200: { description: 'Vínculo encontrado' }, 400: { description: 'Não encontrado' } },
            },
            patch: {
                tags: ['StudentRoutes'],
                summary: 'Atualiza vínculo estudante-rota',
                security: bearerSecurity,
                parameters: [idParam],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateStudentRouteBody' } } } },
                responses: { 200: { description: 'Vínculo atualizado' } },
            },
            delete: {
                tags: ['StudentRoutes'],
                summary: 'Remove vínculo estudante-rota (soft delete)',
                security: bearerSecurity,
                parameters: [idParam],
                responses: { 204: { description: 'Vínculo removido' } },
            },
        },
        '/student-routes/{id}/activate': {
            patch: {
                tags: ['StudentRoutes'],
                summary: 'Ativa vínculo estudante-rota',
                security: bearerSecurity,
                parameters: [idParam],
                responses: { 204: { description: 'Vínculo ativado' } },
            },
        },
        '/student-routes/{id}/inactivate': {
            patch: {
                tags: ['StudentRoutes'],
                summary: 'Inativa vínculo estudante-rota',
                security: bearerSecurity,
                parameters: [idParam],
                responses: { 204: { description: 'Vínculo inativado' } },
            },
        },
        '/students/{studentId}/routes': {
            get: {
                tags: ['StudentRoutes'],
                summary: 'Lista todas as rotas de um estudante',
                security: bearerSecurity,
                parameters: [{ name: 'studentId', in: 'path' as const, required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Rotas do estudante' } },
            },
        },
        '/audit-logs/paginated': {
            get: {
                tags: ['Audit'],
                summary: 'Lista logs de auditoria com filtros e paginação',
                security: bearerSecurity,
                parameters: [
                    ...paginationParams,
                    { name: 'userId', in: 'query' as const, schema: { type: 'integer' } },
                    { name: 'action', in: 'query' as const, schema: { type: 'string', enum: ['CREATE', 'UPDATE', 'DELETE', 'ACTIVATE', 'INACTIVATE'] } },
                    { name: 'entityType', in: 'query' as const, schema: { type: 'string' } },
                    { name: 'entityId', in: 'query' as const, schema: { type: 'integer' } },
                ],
                responses: { 200: { description: 'Lista paginada de logs de auditoria' } },
            },
        },
        '/audit-logs/{id}': {
            get: {
                tags: ['Audit'],
                summary: 'Busca log de auditoria por ID',
                security: bearerSecurity,
                parameters: [idParam],
                responses: { 200: { description: 'Log encontrado' }, 400: { description: 'Não encontrado' } },
            },
        },
        '/audit-logs/{entityType}/{entityId}': {
            get: {
                tags: ['Audit'],
                summary: 'Lista histórico de auditoria de uma entidade específica',
                security: bearerSecurity,
                parameters: [
                    { name: 'entityType', in: 'path' as const, required: true, schema: { type: 'string' }, description: 'Tipo da entidade (ex: routes, students, vehicles)' },
                    { name: 'entityId', in: 'path' as const, required: true, schema: { type: 'integer' } },
                ],
                responses: { 200: { description: 'Histórico de auditoria da entidade' } },
            },
        },
    },
    tags: [
        { name: 'Auth', description: 'Autenticação e autorização' },
        { name: 'Users', description: 'Gerenciamento de usuários' },
        { name: 'Students', description: 'Gerenciamento de estudantes' },
        { name: 'Drivers', description: 'Gerenciamento de motoristas' },
        { name: 'Colleges', description: 'Gerenciamento de instituições de ensino' },
        { name: 'Enrollments', description: 'Gerenciamento de matrículas' },
        { name: 'AccountReceivable', description: 'Contas a receber e tabela de preços' },
        { name: 'Vehicles', description: 'Gerenciamento de veículos' },
        { name: 'Stops', description: 'Gerenciamento de paradas' },
        { name: 'Routes', description: 'Gerenciamento de rotas' },
        { name: 'RouteStops', description: 'Paradas associadas a rotas' },
        { name: 'StudentRoutes', description: 'Vínculos entre estudantes e rotas' },
        { name: 'Audit', description: 'Logs de auditoria (somente ADMIN)' },
    ],
};
