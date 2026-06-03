pipeline {
    agent any

    stages {

        stage('Clone Repository') {
            steps {
                echo 'Cloning repository...'
                git branch: 'main',
                    url: 'https://github.com/Ben-Brahim-amal/b2b-events.git'
            }
        }

        stage('Build Backend') {
            steps {
                echo 'Building Symfony backend...'
                sh '''
                    docker exec b2b_php composer install --no-interaction
                    docker exec b2b_php php bin/console cache:clear --env=prod
                    docker exec b2b_php php bin/console cache:warmup --env=prod
                '''
            }
        }

        stage('Build Frontend') {
            steps {
                echo 'Building React frontend...'
                sh '''
                    cd frontend
                    npm install
                    npm run build
                '''
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying...'
                sh '''
                    docker restart b2b_php
                    docker restart b2b_nginx
                '''
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}