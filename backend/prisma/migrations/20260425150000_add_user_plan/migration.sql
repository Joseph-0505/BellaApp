ALTER TABLE `User`
  ADD COLUMN `plan` ENUM('TRIAL', 'INDIVIDUAL', 'TEAM') NOT NULL DEFAULT 'TRIAL';

UPDATE `User` u
INNER JOIN `ClinicUser` cu ON cu.userId = u.id
INNER JOIN `Clinic` c ON c.id = cu.clinicId
SET u.plan = c.plan;
