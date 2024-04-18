pipeline {
    agent any
    options {
        throttleJobProperty(
        categories: ['Server-Splash'],
        throttleEnabled: true,
        throttleOption: 'category'
        )
        buildDiscarder(logRotator(numToKeepStr: '3'))
    }
    parameters {
        booleanParam(defaultValue: true, description: 'Skip manual review?', name: 'SKIP_REVIEW')
        booleanParam(defaultValue: false, description: "Force Version Bump", name: "FORCE_VERSION_BUMP")
    }
    stages {
        stage ("Initialization") {
            steps {
                script {
                    // Check if the version has been bumped

                    // Fetches master so we can check our commits for version bumps
                    echo "Checking for version bumps..."
                    sh "git fetch origin master:temp_master"
                    def commitsAheadOfMaster = sh(script: 'git log --pretty="%an" temp_master..HEAD', returnStdout: true).trim().split("\n")
                    def isVersionBumped = commitsAheadOfMaster.any { commitAuthor ->
                        commitAuthor == "Jenkins-Version-Bumper"
                    }
                    if (isVersionBumped) {
                        echo "Version already bumped by Jenkins"
                    } else {
                        echo "Version hasn't been bumped by Jenkins yet"
                    }
                    def last_commit_author = sh(script: 'git log -1 --pretty=%an', returnStdout: true).trim()
                    env.VERSION_BUMPED = isVersionBumped.toString()
                    def skip_manual = params.SKIP_REVIEW
                    if (env.JOB_NAME.contains('PR Builder')) { 
                        if (last_commit_author != "Jenkins-Version-Bumper") { // Allows us to skip the manual review if the only change was a version bump
                            skip_manual = false
                            echo "Forcing manual review"
                        }
                    }
                    env.skip_manual_dynamic = skip_manual
                }
            }
        }
        stage ("Clean Up") { // Cleans up artifacts from previous builds, this is why we can't run concurrent builds (port and name conflicts)
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
        stage ("Build") { // Builds the image
            steps {
                echo "Building Server-Splash Image"
                sh "podman --storage-opt ignore_chown_errors=true build -t splash-demo ."
            }
        }
        stage ("Construct Container") { // Constructs a live container for testing and staging
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
        stage ("Test") { // Spawns the test container which will test the previously spawned live container
            steps {
                script{
                    try {
                        sh "cp ./version.txt ./testing/version.txt"
                        sh "podman --storage-opt ignore_chown_errors=true build -t splash-test ./testing/."
                        sh "podman run --network=\"host\" splash-test"
                        env.TEST_RESULT = "Success"
                    } catch (Exception e) {
                        env.TEST_RESULT = "Failure"
                        if (env.skip_manual_dynamic == "true") {
                            error(e)
                        }
                        catchError(buildResult: "SUCCESS", stageResult: "FAILURE") {
                            sh "exit 1"
                        }
                    }
                }
            }
        }
        stage ("Manual Review") { // Allows the developer to manually review the changes. 
            when {
                expression {
                    return env.skip_manual_dynamic == 'false'
                }
            }
            steps {
                script {
                    def baseJenkinsUrl = env.JENKINS_URL
                    def jobNamePath = env.JOB_NAME.replaceAll("/", "/job/")
                    def jobUrl = "${baseJenkinsUrl}job/${jobNamePath}/"
                    def message = "Build requires manual review\n[Jenkins Job](${jobUrl})\n[Live Demo](http://onion.lan:3001)"
                    def chatId = "222789278"
                    withCredentials([string(credentialsId: 'onion-telegram-token', variable: 'TOKEN')]) {
                        sh "curl -s -X POST https://api.telegram.org/bot${TOKEN}/sendMessage -d chat_id=${chatId} -d text='${message}' -d parse_mode=Markdown"
                    }
                    if (env.TEST_RESULT == "Success") {
                        input(id: 'userInput', message: 'Is the build okay?')
                    } else {
                        input(id: "userInput", message: 'There were failures in the testing stage, please review the live environment')
                        error("Test stage failed")
                    }                    
                }
            }
        }
        stage ("Change Version") { // Bumps the version.txt file if applicable.
            steps {
                script {
                    if (env.CHANGE_ID) { // If this is a PR
                        withCredentials([usernamePassword(credentialsId: "Jenkins-Github-PAT-UN", passwordVariable: "PAT")]) { // For getting PR details later
                            // Bypass version bumping if applicable
                            if (env.VERSION_BUMPED == "true") {
                                if (env.FORCE_VERSION_BUMP == "false") {
                                    echo "Version already bumped by Jenkins for this PR, skipping."
                                    return
                                } else {
                                    echo "Version already bumped for this PR, but force version bump is selected. Bumping version."
                                }
                            }
                            // Get PR details
                            def response = sh(script: "curl -s -H \"Authorization: token $PAT\" https://api.github.com/repos/whgDosumi/Server-Splash/pulls/${env.CHANGE_ID}", returnStdout: true).trim()
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
                            withCredentials([usernamePassword(credentialsId: 'Jenkins-Github-PAT-UN', passwordVariable: 'GIT_PASSWORD', usernameVariable: 'GIT_USERNAME')]) {
                                // Set url
                                sh "git remote set-url origin https://$GIT_USERNAME:$GIT_PASSWORD@github.com/whgDosumi/Server-Splash.git"
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
                        }
                    } else {
                        echo "Skipping, this is not a PR"
                    }
                }
            }
        }
    }
    post { // Sends me a Telegram message on my bot that informs me of the build status.
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