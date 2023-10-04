def skip_manual_review = true
pipeline {
    agent any
    parameters {
        booleanParam(defaultValue: true, description: 'Skip manual review?', name: 'SKIP_REVIEW')
    }
    stages {
        stage ("Initialization") {
                steps {
                    script {
                        skip_manual_review = params.SKIP_REVIEW
                        if (env.JOB_NAME.contains('PR Builder')) {
                            skip_manual_review = false
                        }
                    }
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
                    -v splash-demo_userdata:/var/node/user_data \
                    --name splash-demo \
                    splash-demo
                '''
                echo "Starting Container"
                sh "podman container start splash-demo"
            }
        }
        stage ("Test") {
            steps {
                sh "podman --storage-opt ignore_chown_errors=true build -t splash-test ./testing/."
                sh "podman run --network=\"host\" splash-test"
            }
        }
        stage ("Manual Review") {
            when {
                expression {
                    return !skip_manual_review
                }
            }
            steps {
                input(id: 'userInput', message: 'Is the build okay?')
            }
        }
    }
}

