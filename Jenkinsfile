// pipeline {
//     agent any
   
//     options {
//         timestamps()
//         buildDiscarder(logRotator(numToKeepStr: '10'))
//         timeout(time: 1, unit: 'HOURS')
//     }
   
//     // ── Parameters: user selects test type, ENV and BROWSER on each build ──
//     parameters {
//         choice(
//             name: 'TEST_TYPE',
//             choices: ['playwright', 'cucumber', 'all'],
//             description: 'Type of tests to run'
//         )
//         choice(
//             name: 'ENV',
//             choices: ['qa', 'stg'],
//             description: 'Target environment to run tests against'
//         )
//         choice(
//             name: 'BROWSER',
//             choices: ['firefox', 'webkit'],
//             description: 'Browser to use (firefox, webkit)'
//         )
//     }
   
//     environment {
//         IMAGE_NAME = "automation-web-tests:${env.BUILD_NUMBER}"
//         WORKSPACE_DIR = "${WORKSPACE}"
//     }
   
//     stages {
//         stage('Checkout') {
//             steps {
//                 checkout scm
//             }
//         }
   
       
//         stage('Build Docker Image') {
//             steps {
//                 script {
//                     echo "Building Docker image: ${IMAGE_NAME}"
//                     sh """
//                         docker build -t ${IMAGE_NAME} -f Dockerfile .
//                     """
//                 }
//             }
//         }
       
//         stage('Run Tests') {
//             steps {
//                 script {
//                     withCredentials([
//                         string(credentialsId: 'TEST_PHONE',    variable: 'TEST_PHONE'),
//                         string(credentialsId: 'TEST_PASSWORD', variable: 'TEST_PASSWORD'),
//                         string(credentialsId: 'BASE_URL',       variable: 'BASE_URL')
//                     ]) {
//                         def testCommand = getTestCommand(params.TEST_TYPE, params.ENV, params.BROWSER)
                       
//                         // Load .env file
//                         def envFile = "${params.ENV}.env"
                       
//                         sh """
//                             # We use 'docker create' then 'docker start' so we can use 'docker cp' later,
//                             # avoiding Host-vs-Container volume mount issues in a Docker-in-Docker CI setup.
//                             CONTAINER_ID=\$(docker create \\
//                                 -e ENV=${params.ENV} \\
//                                 -e BROWSER=${params.BROWSER} \\
//                                 -e BASE_URL=\$BASE_URL \\
//                                 -e ALLURE_RESULTS_DIR=allure-results \\
//                                 -e TEST_PHONE=\$TEST_PHONE \\
//                                 -e TEST_PASSWORD=\$TEST_PASSWORD \\
//                                 ${IMAGE_NAME})
 
//                             set +e
//                             docker start -a \$CONTAINER_ID
//                             EXIT_CODE=\$?
//                             set -e
 
//                             # Copy the test output to Jenkins workspace
//                             docker cp \$CONTAINER_ID:/app/allure-results ./ || true
//                             docker cp \$CONTAINER_ID:/app/videos ./ || true
 
//                             docker rm \$CONTAINER_ID
 
//                             exit \$EXIT_CODE
//                         """
//                     }
//                 }
//             }
//             post {
//                 always {
//                     echo "Collecting test results..."
//                     archiveArtifacts artifacts: 'allure-results/**,test-results/**', allowEmptyArchive: true
//                 }
//                 failure {
//                     archiveArtifacts artifacts: 'screenshots/**', allowEmptyArchive: true
//                 }
//             }
//         }
       
//         stage('Generate Allure Report') {
//             steps {
//                 script {
//                     sh "echo '📈 Generating Allure Report...'"
                   
//                     allure([
//                         includeProperties: false,
//                         jdk: '',
//                         properties: [],
//                         reportBuildPolicy: 'ALWAYS',
//                         results: [[path: 'allure-results']],
//                     ])
//                 }
//             }
//         }
//     }
   
//     post {
//         always {
//             // Clean up the image to save disk space on the Jenkins host
//             sh "docker rmi ${env.IMAGE_NAME} || true"
//         }
//         success {
//             echo "✅ Tests passed on ENV=${params.ENV} | BROWSER=${params.BROWSER}"
//         }
//         failure {
//             echo "❌ Tests FAILED on ENV=${params.ENV} | BROWSER=${params.BROWSER} – check Allure report"
//         }
//     }
// }
 
// // ── Helper function to build test command ──
// def getTestCommand(testType, env, browser) {
//     // Execute the npm script defined in package.json, for instance, test:qa:firefox
//     return "npm run test:${env}:${browser}"
// }

pipeline {
    agent any
    
    parameters {
        choice(name: 'TEST_TYPE', choices: ['playwright', 'cucumber', 'all'], description: 'Type of tests to run')
        choice(name: 'ENV', choices: ['qa', 'stg'], description: 'Target environment')
        choice(name: 'BROWSER', choices: ['firefox', 'webkit'], description: 'Browser')
    }
    
    environment {
        IMAGE_NAME = "automation-web-tests:${env.BUILD_NUMBER}"
        // Lấy Webhook từ Credentials đã tạo ở Bước 2
        TEAMS_WEBHOOK = credentials('TEAMS_WEBHOOK_URL')
    }
    
    stages {
        stage('Checkout') { steps { checkout scm } }
        
        stage('Build & Run Tests') {
            steps {
                script {
                    sh "docker build -t ${IMAGE_NAME} -f Dockerfile ."
                    
                    withCredentials([
                        string(credentialsId: 'TEST_PHONE',    variable: 'TEST_PHONE'),
                        string(credentialsId: 'TEST_PASSWORD', variable: 'TEST_PASSWORD'),
                        string(credentialsId: 'BASE_URL',       variable: 'BASE_URL')
                    ]) {
                        sh """
                            CONTAINER_ID=\$(docker create -e ENV=${params.ENV} -e BROWSER=${params.BROWSER} \
                                -e BASE_URL=\$BASE_URL -e TEST_PHONE=\$TEST_PHONE \
                                -e TEST_PASSWORD=\$TEST_PASSWORD ${IMAGE_NAME})
                            
                            set +e
                            docker start -a \$CONTAINER_ID
                            EXIT_CODE=\$?
                            set -e
                            
                            docker cp \$CONTAINER_ID:/app/allure-results ./ || true
                            docker rm \$CONTAINER_ID
                            exit \$EXIT_CODE
                        """
                    }
                }
            }
        }
        
        stage('Allure Report') {
            steps {
                allure([
                    reportBuildPolicy: 'ALWAYS',
                    results: [[path: 'allure-results']],
                ])
            }
        }
    }
    
    post {
        always {
            sh "docker rmi ${env.IMAGE_NAME} || true"
            
            script {
                // 1. Lấy con số Pass/Fail thực tế từ Allure Plugin
                def allureAction = currentBuild.rawBuild.getAction(io.qameta.allure.jenkins.AllureReportBuildData.class)
                def summary = "N/A"
                if (allureAction != null) {
                    summary = "✅ Passed: ${allureAction.passedCount} | ❌ Failed: ${allureAction.failedCount} | ⚠️ Broken: ${allureAction.brokenCount}"
                }

                // 2. Xác định màu sắc (Xanh: Pass, Đỏ: Fail)
                def color = (currentBuild.currentResult == 'SUCCESS') ? "00FF00" : "FF0000"
                def statusText = (currentBuild.currentResult == 'SUCCESS') ? "PASSED" : "FAILED"

                // 3. Gửi thông báo sang Teams bằng curl
                sh """
                curl -H 'Content-Type: application/json' -d '{
                    "@type": "MessageCard",
                    "@context": "http://schema.org/extensions",
                    "themeColor": "${color}",
                    "summary": "Job #${env.BUILD_NUMBER}",
                    "sections": [{
                        "activityTitle": "🚀 Automation Test #${env.BUILD_NUMBER} - ${statusText}",
                        "activitySubtitle": "Environment: ${params.ENV.toUpperCase()} | Browser: ${params.BROWSER}",
                        "facts": [
                            { "name": "Result Details", "value": "${summary}" },
                            { "name": "Finished At", "value": "${new Date().format('yyyy-MM-dd HH:mm:ss')}" }
                        ],
                        "markdown": true
                    }],
                    "potentialAction": [{
                        "@type": "OpenUri",
                        "name": "🌐 View Allure Report",
                        "targets": [{ "os": "default", "uri": "${env.BUILD_URL}allure/" }]
                    }]
                }' ${env.TEAMS_WEBHOOK}
                """
            }
        }
    }
}