-- Run as the postgres superuser. Replace <PASSWORD> with a generated password.
CREATE ROLE recispy WITH LOGIN PASSWORD '<PASSWORD>';
CREATE DATABASE recispy OWNER recispy;
CREATE DATABASE recispy_test OWNER recispy;
\c recispy
GRANT ALL ON SCHEMA public TO recispy;
\c recispy_test
GRANT ALL ON SCHEMA public TO recispy;
