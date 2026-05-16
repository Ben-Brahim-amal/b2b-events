<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260420201431 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE event ADD areas_of_activity JSON DEFAULT NULL');
        $this->addSql('ALTER TABLE registration ADD processed_by_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE registration ADD CONSTRAINT FK_62A8A7A72FFD4FD3 FOREIGN KEY (processed_by_id) REFERENCES `user` (id)');
        $this->addSql('CREATE INDEX IDX_62A8A7A72FFD4FD3 ON registration (processed_by_id)');
        $this->addSql('ALTER TABLE user CHANGE user_role user_role VARCHAR(20) NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE event DROP areas_of_activity');
        $this->addSql('ALTER TABLE registration DROP FOREIGN KEY FK_62A8A7A72FFD4FD3');
        $this->addSql('DROP INDEX IDX_62A8A7A72FFD4FD3 ON registration');
        $this->addSql('ALTER TABLE registration DROP processed_by_id');
        $this->addSql('ALTER TABLE `user` CHANGE user_role user_role VARCHAR(20) DEFAULT \'ROLE_ENTREPRENEUR\' NOT NULL');
    }
}
