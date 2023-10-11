pipeline {
    agent any
    parameters {
        booleanParam(defaultValue: true, description: 'Skip manual review?', name: 'SKIP_REVIEW')
    }
    stages {
        stage ("Initialization") {
            steps {
                script {
                    def skip_manual = params.SKIP_REVIEW
                    if (env.JOB_NAME.contains('PR Builder')) {
                        skip_manual = false
                    }
                    env.skip_manual_dynamic = skip_manual
                }
            }
        }
        stage ("Clean Up") {
            steps{
                echo "Removing existing test containers"
                sh "podman ps -a -q -f ancestor=splash-test | xargs -I {} podman container rm -f {} || true"
                echo "Stopping existing container"
                sh "podman container stop splash-demo || true"
                echo "Removing existing container"
                sh "podman container rm splash-demo || true"
                echo "Removing existing image"
                sh "podman image rm splash-demo || true"
            }
        }
        stage ("Build") {
            steps {
                echo "Building Container Image"
                sh "podman --storage-opt ignore_chown_errors=true build -t splash-demo ."
            }
        }
        stage ("Deploy") {
            steps {
                echo "Constructing Container"
                sh '''
                podman create \
                    -p 3001:3000 \
                    --name splash-demo \
                    splash-demo
                '''
                echo "Starting Container"
                sh "podman container start splash-demo"
            }
        }
        stage ("Test") {
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                    sh "podman --storage-opt ignore_chown_errors=true build -t splash-test ./testing/."
                    sh "podman run --network=\"host\" splash-test"
                }
            }
        }
        stage ("Manual Review") {
            when {
                expression {
                    return env.skip_manual_dynamic == 'false'
                }
            }
            steps {
                input(id: 'userInput', message: 'Is the build okay?')
            }
        }
        stage ("Change Version") {
            steps {
                script {
                    if (env.CHANGE_ID) {
                        // Use GitHub API to get PR details
                        withCredentials([string(credentialsId: "Jenkins-Github-PAT", variable: "PAT")]) {
                            def last_commit_author = sh(script: 'git log -1 --pretty=%an', returnStdout: true).trim()
                            if (last_commit_author == "Jenkins-Version-Bumper") {
                                echo "Version already bumped by Jenkins for this PR, skipping."
                                return
                            }
                            def response = sh(script: "curl -s -H \"Authorization: token ${PAT}\" https://api.github.com/repos/whgDosumi/Server-Splash/pulls/${env.CHANGE_ID}", returnStdout: true).trim()
                            def pr = readJSON text: response
                            def branch_name = pr.head.ref
                            def pr_title = pr.title.toLowerCase()
                            echo "PR Title: ${pr.title}"
                            // Add execute permissions to bump_version script
                            sh "chmod +x bump_version.sh"
                            // Check for the pr type
                            if (pr_title.contains("[major]")) {
                                sh "./bump_version.sh major"
                            } else if (pr_title.contains("[minor]")) {
                                sh "./bump_version.sh minor"
                            } else if (pr_title.contains("[patch]")) {
                                sh "./bump_version.sh patch"
                            } else {
                                error("Invalid PR title: '${pr.title}'. Expected [major], [minor], or [patch] in the title")
                            }
                            // Set git configs
                            echo "Committing version changes to repo"
                            sh "git config user.name \"Jenkins-Version-Bumper\""
                            sh "git config user.email \"lewis.dom21@gmail.com\""
                            // Stage changes
                            sh "git add version.txt"
                            // Commit
                            sh "git commit -m \"Bump Version\""
                            // Push changes
                            sh "git push origin HEAD:${branch_name}"
                        }
                    } else {
                        echo "Skipping, this is not a PR"
                    }
                }
            }
        }
    }
    post {
        success {
            script {
                def message = "Build Successful: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
                def chatId = "222789278"
                withCredentials([string(credentialsId: 'onion-telegram-token', variable: 'TOKEN')]) {
                    sh "curl -s -X POST https://api.telegram.org/bot${TOKEN}/sendMessage -d chat_id=${chatId} -d text='${message}'"
                }
            }
        }
        failure {
            script {
                def message = "Build Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
                def chatId = "222789278"
                withCredentials([string(credentialsId: 'onion-telegram-token', variable: 'TOKEN')]) {
                    sh "curl -s -X POST https://api.telegram.org/bot${TOKEN}/sendMessage -d chat_id=${chatId} -d text='${message}'"
                }
            }
        }
    }
}

