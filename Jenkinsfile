pipeline {
    agent any
    
    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 1, unit: 'HOURS')
    }
    
    // ── Parameters: user selects test type, ENV and BROWSER on each build ──
    parameters {
        choice(
            name: 'TEST_TYPE',
            choices: ['playwright', 'cucumber', 'all'],
            description: 'Type of tests to run'
        )
        choice(
            name: 'ENV',
            choices: ['qa', 'stg'],
            description: 'Target environment to run tests against'
        )
        choice(
            name: 'BROWSER',
            choices: ['firefox', 'webkit'],
            description: 'Browser to use (firefox, webkit)'
        )
    }
    
    environment {
        IMAGE_NAME = "automation-web-tests:${env.BUILD_NUMBER}"
        WORKSPACE_DIR = "${WORKSPACE}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
    
        
        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building Docker image: ${IMAGE_NAME}"
                    sh """
                        docker build -t ${IMAGE_NAME} -f Dockerfile .
                    """
                }
            }
        }
        
        stage('Run Tests') {
            steps {
                script {
                    withCredentials([
                        string(credentialsId: 'TEST_PHONE',    variable: 'TEST_PHONE'),
                        string(credentialsId: 'TEST_PASSWORD', variable: 'TEST_PASSWORD')
                    ]) {
                        def testCommand = getTestCommand(params.TEST_TYPE, params.ENV, params.BROWSER)                        
                        // Load .env file
                        def envFile = "${params.ENV}.env"
                        
                        sh """
                            docker run --rm \
                                -e ENV=${params.ENV} \
                                -e BROWSER=${params.BROWSER} \
                                -e TEST_PHONE=\$TEST_PHONE \
                                -e TEST_PASSWORD=\$TEST_PASSWORD \
                                -e CI=true \
                                -v ${WORKSPACE_DIR}/allure-results:/app/allure-results \
                                -v ${WORKSPACE_DIR}/test-results:/app/test-results \
                                -v ${WORKSPACE_DIR}/screenshots:/app/screenshots \
                                ${IMAGE_NAME} \
                                ${testCommand}
                        """
                    }
                }
            }
            post {
                always {
                    echo "Collecting test results..."
                    archiveArtifacts artifacts: 'allure-results/**,test-results/**', allowEmptyArchive: true
                }
                failure {
                    archiveArtifacts artifacts: 'screenshots/**', allowEmptyArchive: true
                }
            }
        }
        
        stage('Generate Allure Report') {
            steps {
                script {
                    sh "echo '📈 Generating Allure Report...'"
                    
                    allure([
                        includeProperties: false,
                        jdk: '',
                        properties: [],
                        reportBuildPolicy: 'ALWAYS',
                        results: [[path: 'allure-results']],
                    ])
                }
            }
        }
    }
    
    post {
        always {
            // Publish test results
            // junit testResults: 'test-results/junit-report.xml', allowEmptyResults: true
            sh """
                docker run --rm -v ${WORKSPACE}:/workspace busybox chown -R \$(id -u):\$(id -g) /workspace/allure-results /workspace/test-results || true
            """
            
            // Clean up Docker image
            sh "docker rmi ${IMAGE_NAME} 2>/dev/null || true"
            sh "docker system prune -f 2>/dev/null || true"
        }
        
        success {
            echo """
            ✅ Tests passed successfully!
            ━━━━━━━━━━━━━━━━━━━━━
            ENV: ${params.ENV}
            BROWSER: ${params.BROWSER}
            TEST_TYPE: ${params.TEST_TYPE}
            ━━━━━━━━━━━━━━━━━━━━━
            """
        }
        
        failure {
            echo """
            ❌ Tests FAILED
            ━━━━━━━━━━━━━━━━━━━━━
            ENV: ${params.ENV}
            BROWSER: ${params.BROWSER}
            TEST_TYPE: ${params.TEST_TYPE}
            📊 Check Allure Report for details
            ━━━━━━━━━━━━━━━━━━━━━
            """
        }
    }
}

// ── Helper function to build test command ──
def getTestCommand(testType, env, browser) {
    // Execute the npm script defined in package.json, for instance, test:qa:firefox
    return "npm run test:${env}:${browser}"
}