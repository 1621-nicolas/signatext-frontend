IF DB_ID('signatext_db') IS NULL
BEGIN
    CREATE DATABASE signatext_db;
END;
GO

USE signatext_db;
GO

IF OBJECT_ID('dbo.usuario', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.usuario (
        id_usuario BIGINT IDENTITY(1,1) PRIMARY KEY,
        nombre NVARCHAR(100) NOT NULL,
        correo NVARCHAR(150) NOT NULL UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        fecha_registro DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        estado BIT NOT NULL DEFAULT 1
    );
END;
GO
