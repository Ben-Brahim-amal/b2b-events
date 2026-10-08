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

        stage('SonarQube Analysis') {
            steps {
                echo 'Running SonarQube analysis...'
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        docker exec b2b_sonarqube sonar-scanner \
                            -Dsonar.projectKey=B2B-Events \
                            -Dsonar.projectName="B2B Events" \
                            -Dsonar.sources=app/src \
                            -Dsonar.tests=app/tests \
                            -Dsonar.exclusions=app/vendor/**,frontend/node_modules/**,app/var/**
                    '''
                }
            }
        }

        stage('Quality Gate') {
            steps {
                echo 'Checking Quality Gate...'
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
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
            echo 'Pipeline failed! Check SonarQube quality gate.'
        }
    }
}