#! /bin/bash

# Ensure a keyword is passed
if [ -z "$1" ]; then
    echo "Error: No keyword provided. Please provide 'major', 'minor', or 'patch' as an argument."
    exit 1
fi

# Read current version from file
read -r major minor patch < <(cat ./version.txt | tr '.' ' ')

# Bump based on keyword
case "$1" in
    major)
        major=$((major + 1))
        minor=0
        patch=0
        ;;
    minor)
        minor=$((minor + 1))
        patch=0
        ;;
    patch)
        patch=$((patch + 1))
        ;;
    *)
        echo "Error: Invalid keyword. Use 'major', 'minor', or 'patch'."
        exit 1
        ;;
esac

# Write the new version back to version.txt
echo "$major.$minor.$patch" > ./version.txt

echo "Updated version: $major.$minor.$patch"