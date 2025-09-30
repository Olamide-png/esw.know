--
-- PostgreSQL database cluster dump
--

\restrict 1i3bZISiGMGLPEMWpCFbacya694Rtl5Hyef3i1NInr9595saJTcthMftk345mhe

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE app;
ALTER ROLE app WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:MZ4d+ALAMppQ3WxOj/qK9g==$irbYS8BIyLvfidU+s4soLsxw+Igj6WmnzagmriQDMpI=:ZJ4nA0JsD2hps8nv/K/QDglg4Ky6jh/2cVe9Agrid5o=';
CREATE ROLE postgres;
ALTER ROLE postgres WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:gyvhNFNv+QShg49D2jQhXw==$3Pw2eMe6EKOpHY/nq9U8k10MC8cmR8ovWFZyErsw53M=:znpSbrZg/dRZ8sc7yW2zVEEbJvb+WAjl/1NbFI4wd3M=';

--
-- User Configurations
--








\unrestrict 1i3bZISiGMGLPEMWpCFbacya694Rtl5Hyef3i1NInr9595saJTcthMftk345mhe

--
-- PostgreSQL database cluster dump complete
--

