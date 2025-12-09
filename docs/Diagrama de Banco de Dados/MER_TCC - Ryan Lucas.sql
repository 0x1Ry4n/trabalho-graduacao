/* MER_TCC - Ryan Lucas: */

CREATE TABLE Users (
    id Número PRIMARY KEY,
    fk_role_role_PK Texto,
    username Texto(255),
    email Texto(255),
    password Texto(255),
    active Número,
    UNIQUE (username, email)
);

CREATE TABLE Students (
    id Número PRIMARY KEY,
    userId Número,
    name Texto(150),
    motherName Texto(150),
    cpf Texto(15),
    rg Texto(11),
    cin Texto(11),
    city Texto(1000),
    cep Texto(15),
    neighborhood Texto(100),
    year Número,
    collegeId Número,
    email Texto(255),
    phone Texto(20),
    semester Número,
    course Texto(150),
    residenceProofUrl Texto(255),
    photoUrl Texto(255),
    birthDate Texto,
    active Número,
    notes Texto(1000)
);

CREATE TABLE Sessions (
    id Número PRIMARY KEY,
    userId Número,
    refreshToken Texto(255),
    expiresAt Texto
);

CREATE TABLE Audit_logs (
    id Número PRIMARY KEY,
    userId Número,
    fk_action_action_PK INT,
    entityId Número,
    entityType Texto(100),
    oldValues Texto,
    newValues Texto,
    ipAddress Texto(50),
    userAgent Texto(500),
    createdAt Texto
);

CREATE TABLE Drivers (
    id Número PRIMARY KEY,
    userId Número,
    fk_contractType_contractType_PK INT,
    name Texto(150),
    motherName Texto(150),
    licenseNumber Texto(11),
    city Texto(100),
    neighborhood Texto(100),
    cep Texto(15),
    cpf Texto(15),
    cnpj Texto(18),
    rg Texto(11),
    phone Texto(20),
    email Texto(255),
    salary Número,
    admissionDate Texto,
    rescissionDate Texto,
    residenceProofUrl Texto(255),
    active Número,
    photoUrl Texto(255)
);

CREATE TABLE Colleges (
    id Número PRIMARY KEY,
    name Texto(150),
    address Texto(200),
    city Texto(100),
    neighborhood Texto(100),
    cep Texto(15),
    contactEmail Texto(255),
    contactPhone Texto(50),
    active Número
);

CREATE TABLE Enrollments (
    id Número PRIMARY KEY,
    studentId Número,
    collegeId Número,
    cardCode Texto(12) UNIQUE,
    course Texto(150),
    semester Número,
    year Número,
    monthlyFee Número,
    enrollmentFee Número,
    photoUrl Texto(255),
    residenceProofUrl Texto(255),
    collegeEnrollmentUrl Texto(255)
);

CREATE TABLE Payers (
    id Número PRIMARY KEY,
    studentId Número,
    fk_type_type_PK INT,
    companyName Texto(150),
    active Número
);

CREATE TABLE Account_receivables (
    id Número PRIMARY KEY,
    payerId Número,
    enrollmentId Número,
    fk_paymentType_paymentType_PK INT,
    fk_paymentProofType_paymentProofType_PK INT,
    fk_accountReceivableType_accountReceivableType_PK INT,
    fk_status_status_PK INT,
    description Texto(1000),
    amount Número,
    dueDate Texto,
    active Número,
    paymentDate Texto,
    paymentProofUrl Texto(255)
);

CREATE TABLE Routes (
    id Número PRIMARY KEY,
    vehicleId Número,
    driverId Número,
    name Texto(150),
    startLat Número,
    startLong Número,
    endLat Número,
    endLong Número,
    startTime Texto,
    endTime Texto,
    estimatedDuration Número,
    active Número,
    plate Texto(10),
    model Texto(50),
    capacity Número,
    notes Texto(1000)
);

CREATE TABLE Route_stops (
    id Número PRIMARY KEY,
    routeId Número,
    stopId Número,
    stopOrder Número,
    estimatedArrival Número
);

CREATE TABLE Stops (
    id Número PRIMARY KEY,
    name Texto(150),
    address Texto(200),
    city Texto(100),
    neighborhood Texto(100),
    cep Texto(15),
    latitude Número,
    longitude Número
);

CREATE TABLE Student_routes (
    id Número PRIMARY KEY,
    studentId Número,
    routeStopId Número,
    routePeriod Número,
    departureTime Texto,
    returnTime Texto,
    startDate Texto,
    endDate Texto,
    active Número
);

CREATE TABLE Card_validations (
    id Número PRIMARY KEY,
    studentId Número,
    driverId Número,
    routeId Número,
    fk_status_status_PK INT,
    latitude Número,
    longitude Número,
    validationTime Texto
);

CREATE TABLE Prices (
    id Número PRIMARY KEY,
    fk_paymentType_paymentType_PK Texto,
    fk_type_type_PK Texto,
    price Número,
    dueDate Texto,
    active Número
);

CREATE TABLE role (
    role_PK Texto NOT NULL PRIMARY KEY,
    STUDENT Texto,
    DRIVER Texto,
    ADMIN Texto
);

CREATE TABLE action (
    action_PK INT NOT NULL PRIMARY KEY,
    CREATE Texto,
    UPDATE Texto,
    DELETE Texto,
    ACTIVATE Texto,
    INACTIVATE Texto
);

CREATE TABLE contractType (
    contractType_PK INT NOT NULL PRIMARY KEY,
    CLT Texto,
    PJ Texto,
    FREELANCER Texto
);

CREATE TABLE status (
    status_PK INT NOT NULL PRIMARY KEY,
    ACTIVE Texto,
    FINISHED Texto,
    CANCELED Texto
);

CREATE TABLE type (
    type_PK INT NOT NULL PRIMARY KEY,
    STUDENT Texto,
    COMPANY Texto
);

CREATE TABLE paymentType (
    paymentType_PK INT NOT NULL PRIMARY KEY,
    CASH Texto,
    PIX Texto,
    DEBIT_CARD Texto,
    BANK_TRANSFER Texto,
    CREDIT_CARD Texto,
    ANY Texto
);

CREATE TABLE accountReceivableType (
    accountReceivableType_PK INT NOT NULL PRIMARY KEY,
    ENROLLMENT_FEE Texto,
    MONTHLY_FEE Texto
);

CREATE TABLE status (
    status_PK INT NOT NULL PRIMARY KEY,
    OPEN Texto,
    PAID Texto,
    CANCELED Texto
);

CREATE TABLE paymentProofType (
    paymentProofType_PK INT NOT NULL PRIMARY KEY,
    FILE Texto,
    OTHER Texto
);

CREATE TABLE type (
    type_PK INT NOT NULL PRIMARY KEY,
    MICROBUS Texto,
    BUS Texto,
    VAN Texto
);

CREATE TABLE status (
    status_PK INT NOT NULL PRIMARY KEY,
    VALID Texto,
    INVALID Texto
);

CREATE TABLE paymentType (
    paymentType_PK Texto NOT NULL PRIMARY KEY,
    CASH Texto,
    DEBIT_CARD Texto,
    CREDIT_CARD Texto,
    PIX Texto,
    BANK_TRANSFER Texto,
    ANY Texto
);

CREATE TABLE type (
    type_PK Texto NOT NULL PRIMARY KEY,
    ENROLLMENT_FEE Texto,
    MONTHLY_FEE Texto
);

CREATE TABLE Vehicles (
    id Número PRIMARY KEY,
    type INT,
    plate Texto(10) UNIQUE,
    model Texto(50),
    capacity Número,
    active Número,
    notes Texto(1000)
);
 
ALTER TABLE Users ADD CONSTRAINT FK_Users_1
    FOREIGN KEY (fk_role_role_PK)
    REFERENCES role (role_PK)
    ON DELETE SET NULL;
 
ALTER TABLE Students ADD CONSTRAINT FK_Students_2
    FOREIGN KEY (userId)
    REFERENCES Users (id);
 
ALTER TABLE Sessions ADD CONSTRAINT FK_Sessions_2
    FOREIGN KEY (userId)
    REFERENCES Users (id);
 
ALTER TABLE Audit_logs ADD CONSTRAINT FK_Audit_logs_2
    FOREIGN KEY (userId)
    REFERENCES Users (id);
 
ALTER TABLE Audit_logs ADD CONSTRAINT FK_Audit_logs_3
    FOREIGN KEY (fk_action_action_PK)
    REFERENCES action (action_PK);
 
ALTER TABLE Drivers ADD CONSTRAINT FK_Drivers_2
    FOREIGN KEY (userId)
    REFERENCES Users (id);
 
ALTER TABLE Drivers ADD CONSTRAINT FK_Drivers_3
    FOREIGN KEY (fk_contractType_contractType_PK)
    REFERENCES contractType (contractType_PK);
 
ALTER TABLE Enrollments ADD CONSTRAINT FK_Enrollments_2
    FOREIGN KEY (studentId)
    REFERENCES Students (id);
 
ALTER TABLE Enrollments ADD CONSTRAINT FK_Enrollments_3
    FOREIGN KEY (collegeId)
    REFERENCES Colleges (id);
 
ALTER TABLE Payers ADD CONSTRAINT FK_Payers_2
    FOREIGN KEY (studentId)
    REFERENCES Students (id);
 
ALTER TABLE Payers ADD CONSTRAINT FK_Payers_3
    FOREIGN KEY (fk_type_type_PK)
    REFERENCES type (type_PK);
 
ALTER TABLE Account_receivables ADD CONSTRAINT FK_Account_receivables_1
    FOREIGN KEY (payerId)
    REFERENCES Payers (id);
 
ALTER TABLE Account_receivables ADD CONSTRAINT FK_Account_receivables_2
    FOREIGN KEY (enrollmentId)
    REFERENCES Enrollments (id);
 
ALTER TABLE Account_receivables ADD CONSTRAINT FK_Account_receivables_4
    FOREIGN KEY (fk_paymentType_paymentType_PK)
    REFERENCES paymentType (paymentType_PK);
 
ALTER TABLE Account_receivables ADD CONSTRAINT FK_Account_receivables_5
    FOREIGN KEY (fk_accountReceivableType_accountReceivableType_PK)
    REFERENCES accountReceivableType (accountReceivableType_PK);
 
ALTER TABLE Account_receivables ADD CONSTRAINT FK_Account_receivables_6
    FOREIGN KEY (fk_status_status_PK)
    REFERENCES status (status_PK);
 
ALTER TABLE Account_receivables ADD CONSTRAINT FK_Account_receivables_7
    FOREIGN KEY (fk_paymentProofType_paymentProofType_PK)
    REFERENCES paymentProofType (paymentProofType_PK);
 
ALTER TABLE Routes ADD CONSTRAINT FK_Routes_2
    FOREIGN KEY (fk_Drivers_id)
    REFERENCES Drivers (id)
    ON DELETE CASCADE;
 
ALTER TABLE Routes ADD CONSTRAINT FK_Routes_3
    FOREIGN KEY (vehicleId)
    REFERENCES Vehicles (id);
 
ALTER TABLE Routes ADD CONSTRAINT FK_Routes_4
    FOREIGN KEY (driverId)
    REFERENCES Drivers (id);
 
ALTER TABLE Route_stops ADD CONSTRAINT FK_Route_stops_2
    FOREIGN KEY (routeId)
    REFERENCES Routes (id);
 
ALTER TABLE Route_stops ADD CONSTRAINT FK_Route_stops_3
    FOREIGN KEY (stopId)
    REFERENCES Stops (id);
 
ALTER TABLE Student_routes ADD CONSTRAINT FK_Student_routes_2
    FOREIGN KEY (routeStopId)
    REFERENCES Route_stops (id);
 
ALTER TABLE Student_routes ADD CONSTRAINT FK_Student_routes_3
    FOREIGN KEY (studentId)
    REFERENCES Students (id);
 
ALTER TABLE Card_validations ADD CONSTRAINT FK_Card_validations_2
    FOREIGN KEY (studentId)
    REFERENCES Students (id);
 
ALTER TABLE Card_validations ADD CONSTRAINT FK_Card_validations_3
    FOREIGN KEY (driverId)
    REFERENCES Drivers (id);
 
ALTER TABLE Card_validations ADD CONSTRAINT FK_Card_validations_4
    FOREIGN KEY (routeId)
    REFERENCES Routes (id);
 
ALTER TABLE Card_validations ADD CONSTRAINT FK_Card_validations_5
    FOREIGN KEY (fk_status_status_PK)
    REFERENCES status (status_PK);
 
ALTER TABLE Prices ADD CONSTRAINT FK_Prices_2
    FOREIGN KEY (fk_paymentType_paymentType_PK)
    REFERENCES paymentType (paymentType_PK)
    ON DELETE SET NULL;
 
ALTER TABLE Prices ADD CONSTRAINT FK_Prices_3
    FOREIGN KEY (fk_type_type_PK)
    REFERENCES type (type_PK)
    ON DELETE SET NULL;
 
ALTER TABLE Vehicles ADD CONSTRAINT FK_Vehicles_3
    FOREIGN KEY (type)
    REFERENCES type (type_PK);