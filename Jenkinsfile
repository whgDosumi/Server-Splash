pipeline {
    agent any
    stages {
        stage ("Clean Up") {
            steps{
                echo "Stopping existing container"
                sh "Podman container stop splash-demo || true"
                echo "Removing existing container"
                sh "Podman container rm splash-demo || true"
                echo "Removing existing image"
                sh "Podman image rm splash-demo || true"
            }
        }
        stage ("Build") {
            steps {
                echo "Building Container Image"
                sh "podman build -t splash-demo ."
            }
        }
        stage ("Deploy") {
            steps {
                echo "Constructing Container"
                sh '''
                podman create \
                    -p 3000:3000 \
                    -v splash-demo_userdata:/var/node/user_data \
                    --name splash-demo \
                    splash-demo
                '''
                echo "Starting Container"
                sh "podman container start splash-demo"
            }
        }
    }
}

