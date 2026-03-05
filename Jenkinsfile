pipeline {
    agent any

    options {
        timestamps()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Install Playwright Browsers') {
            steps {
                // Cài đặt browser và các dependencies hệ thống cần thiết
                sh 'npx playwright install chromium --with-deps'
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    // Sử dụng sh(script: ..., returnStatus: true) để pipeline không bị fail ngay lập tức nếu có test case lỗi
                    // giúp Allure vẫn có thể render được kết quả test fail.
                    sh 'npx playwright test'
                }
            }
        }
    }

    post {
        always {
            // Lệnh này yêu cầu Jenkins Allure Plugin thu thập kết quả từ thư mục allure-results
            allure includeProperties: false, jdk: '', results: [[path: 'allure-results']]
            
            // Vẫn nên archive để backup nếu cần
            archiveArtifacts artifacts: 'allure-results/**', allowEmptyArchive: true
        }
    }
}