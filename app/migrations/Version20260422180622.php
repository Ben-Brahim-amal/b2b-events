<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260422180622 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE meeting (id INT AUTO_INCREMENT NOT NULL, proposed_at DATETIME NOT NULL, duration INT NOT NULL, status VARCHAR(20) NOT NULL, message LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL, requester_id INT NOT NULL, participant_id INT NOT NULL, INDEX IDX_F515E139ED442CF4 (requester_id), INDEX IDX_F515E1399D1C3019 (participant_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE meeting ADD CONSTRAINT FK_F515E139ED442CF4 FOREIGN KEY (requester_id) REFERENCES `user` (id)');
        $this->addSql('ALTER TABLE meeting ADD CONSTRAINT FK_F515E1399D1C3019 FOREIGN KEY (participant_id) REFERENCES `user` (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE meeting DROP FOREIGN KEY FK_F515E139ED442CF4');
        $this->addSql('ALTER TABLE meeting DROP FOREIGN KEY FK_F515E1399D1C3019');
        $this->addSql('DROP TABLE meeting');
    }
}
