<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260809173811 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP INDEX idx_status ON event');
        $this->addSql('DROP INDEX idx_status ON meeting');
        $this->addSql('ALTER TABLE meeting RENAME INDEX fk_meeting_event TO IDX_F515E13971F7E88B');
        $this->addSql('ALTER TABLE opportunity DROP FOREIGN KEY `FK_opportunity_event`');
        $this->addSql('ALTER TABLE opportunity RENAME INDEX idx_opportunity_event TO IDX_8389C3D771F7E88B');
        $this->addSql('DROP INDEX idx_event_status ON registration');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE INDEX idx_status ON event (status)');
        $this->addSql('CREATE INDEX idx_status ON meeting (status)');
        $this->addSql('ALTER TABLE meeting RENAME INDEX idx_f515e13971f7e88b TO FK_meeting_event');
        $this->addSql('ALTER TABLE opportunity RENAME INDEX idx_8389c3d771f7e88b TO idx_opportunity_event');
        $this->addSql('CREATE INDEX idx_event_status ON registration (event_id, status)');
    }
}
