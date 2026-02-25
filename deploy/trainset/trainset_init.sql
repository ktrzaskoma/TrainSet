CREATE DATABASE trainset_user;
CREATE DATABASE trainset_schedule;
CREATE DATABASE trainset_ticketing;
CREATE DATABASE trainset_notification;

GRANT ALL PRIVILEGES ON DATABASE trainset_user TO trainset;
GRANT ALL PRIVILEGES ON DATABASE trainset_schedule TO trainset;
GRANT ALL PRIVILEGES ON DATABASE trainset_ticketing TO trainset;
GRANT ALL PRIVILEGES ON DATABASE trainset_notification TO trainset;

