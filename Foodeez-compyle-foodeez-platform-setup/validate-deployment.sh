#!/bin/bash

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    echo -e "${2}${1}${NC}"
}

# Function to print section headers
print_section() {
    echo ""
    print_color "📋 $1" $BLUE
    echo "----------------------------------------"
}

# Function to check if a file exists and is valid
validate_file() {
    local file=$1
    local description=$2

    if [ -f "$file" ]; then
        if [ -s "$file" ]; then
            print_color "✅ $description exists and is not empty" $GREEN
            return 0
        else
            print_color "⚠️ $description exists but is empty" $YELLOW
            return 1
        fi
    else
        print_color "❌ $description not found" $RED
        return 1
    fi
}

# Function to validate JSON/YAML syntax
validate_syntax() {
    local file=$1
    local description=$2
    local validator=$3

    case $validator in
        "json")
            if command -v jq &> /dev/null; then
                if jq empty "$file" 2>/dev/null; then
                    print_color "✅ $description has valid JSON syntax" $GREEN
                    return 0
                else
                    print_color "❌ $description has invalid JSON syntax" $RED
                    return 1
                fi
            else
                print_color "⚠️ jq not available, skipping JSON validation for $description" $YELLOW
                return 0
            fi
            ;;
        "yaml")
            if command -v yq &> /dev/null; then
                if yq eval '.' "$file" > /dev/null 2>&1; then
                    print_color "✅ $description has valid YAML syntax" $GREEN
                    return 0
                else
                    print_color "❌ $description has invalid YAML syntax" $RED
                    return 1
                fi
            else
                print_color "⚠️ yq not available, skipping YAML validation for $description" $YELLOW
                return 0
            fi
            ;;
        "shell")
            if bash -n "$file" 2>/dev/null; then
                print_color "✅ $description has valid shell syntax" $GREEN
                return 0
            else
                print_color "❌ $description has invalid shell syntax" $RED
                return 1
            fi
            ;;
        *)
            print_color "⚠️ Unknown validator $validator for $description" $YELLOW
            return 0
            ;;
    esac
}

print_color "🔍 Foodeez Backend AWS Deployment Validation" $BLUE
print_color "==========================================" $BLUE

# Track validation results
TOTAL_CHECKS=0
PASSED_CHECKS=0

# Section 1: Core Application Files
print_section "1. Core Application Files"

files_to_check=(
    "src/app.ts:Express Application Configuration"
    "src/server.ts:Server Entry Point"
    "package.json:Package Configuration"
    "tsconfig.json:TypeScript Configuration"
    ".env.example:Environment Example"
)

for file_check in "${files_to_check[@]}"; do
    IFS=':' read -r file description <<< "$file_check"
    ((TOTAL_CHECKS++))
    if validate_file "$file" "$description"; then
        ((PASSED_CHECKS++))
    fi
done

# Section 2: Container Configuration
print_section "2. Container Configuration"

container_files=(
    "Dockerfile:Docker Container Definition"
    ".dockerignore:Docker Build Exclusions"
)

for file_check in "${container_files[@]}"; do
    IFS=':' read -r file description <<< "$file_check"
    ((TOTAL_CHECKS++))
    if validate_file "$file" "$description"; then
        ((PASSED_CHECKS++))
        if [ "$file" = "Dockerfile" ]; then
            # Check if Dockerfile is optimized for production
            if grep -q "multi-stage\|stage" Dockerfile; then
                print_color "✅ Dockerfile uses multi-stage build" $GREEN
            else
                print_color "⚠️ Dockerfile doesn't use multi-stage build" $YELLOW
            fi

            if grep -q "healthcheck\|HEALTHCHECK" Dockerfile; then
                print_color "✅ Dockerfile includes health check" $GREEN
            else
                print_color "⚠️ Dockerfile doesn't include health check" $YELLOW
            fi
        fi
    fi
done

# Section 3: AWS Configuration Files
print_section "3. AWS Configuration Files"

aws_files=(
    "aws-task-definition.json:ECS Task Definition"
    "buildspec.yml:CodeBuild Configuration"
    "appspec.yml:CodeDeploy Configuration"
)

for file_check in "${aws_files[@]}"; do
    IFS=':' read -r file description <<< "$file_check"
    ((TOTAL_CHECKS++))
    if validate_file "$file" "$description"; then
        ((PASSED_CHECKS++))

        # Syntax validation
        case "$file" in
            *.json)
                validate_syntax "$file" "$description" "json"
                ;;
            *.yml|*.yaml)
                validate_syntax "$file" "$description" "yaml"
                ;;
        esac
    fi
done

# Section 4: Infrastructure Templates
print_section "4. Infrastructure Templates"

infrastructure_files=(
    "infrastructure/master.yaml:Master CloudFormation Template"
    "infrastructure/vpc.yaml:VPC and Networking"
    "infrastructure/databases.yaml:Database Services"
    "infrastructure/ecs.yaml:ECS Configuration"
    "infrastructure/monitoring.yaml:Monitoring Setup"
    "infrastructure/security.yaml:Security Configuration"
)

for file_check in "${infrastructure_files[@]}"; do
    IFS=':' read -r file description <<< "$file_check"
    ((TOTAL_CHECKS++))
    if validate_file "$file" "$description"; then
        ((PASSED_CHECKS++))
        validate_syntax "$file" "$description" "yaml"

        # Check for specific CloudFormation features
        case "$file" in
            *vpc.yaml)
                if grep -q "AWS::EC2::VPC\|AWS::EC2::Subnet\|AWS::EC2::InternetGateway" "$file"; then
                    print_color "✅ VPC template includes core networking resources" $GREEN
                fi
                ;;
            *databases.yaml)
                if grep -q "AWS::RDS::DBInstance\|AWS::DocDB::DBCluster\|AWS::ElastiCache::ReplicationGroup" "$file"; then
                    print_color "✅ Database template includes all required services" $GREEN
                fi
                ;;
            *ecs.yaml)
                if grep -q "AWS::ECS::Cluster\|AWS::ECS::Service\|AWS::ElasticLoadBalancingV2::LoadBalancer" "$file"; then
                    print_color "✅ ECS template includes compute and load balancing" $GREEN
                fi
                ;;
            *monitoring.yaml)
                if grep -q "AWS::CloudWatch::Alarm\|AWS::SNS::Topic\|AWS::CloudWatch::Dashboard" "$file"; then
                    print_color "✅ Monitoring template includes alerting and dashboards" $GREEN
                fi
                ;;
            *security.yaml)
                if grep -q "AWS::WAFv2::WebACL\|AWS::KMS::Key\|AWS::IAM::Role" "$file"; then
                    print_color "✅ Security template includes WAF and encryption" $GREEN
                fi
                ;;
        esac
    fi
done

# Section 5: Deployment Scripts
print_section "5. Deployment Scripts"

script_files=(
    "deploy.sh:Main Deployment Script"
    "scripts/pre-build.sh:Pre-build Hook"
    "scripts/post-build.sh:Post-build Hook"
    "scripts/before-install.sh:Pre-install Hook"
    "scripts/after-install.sh:Post-install Hook"
    "scripts/validate-service.sh:Service Validation"
)

for file_check in "${script_files[@]}"; do
    IFS=':' read -r file description <<< "$file_check"
    ((TOTAL_CHECKS++))
    if validate_file "$file" "$description"; then
        ((PASSED_CHECKS++))

        # Check if script is executable
        if [ -x "$file" ]; then
            print_color "✅ $description is executable" $GREEN
        else
            print_color "⚠️ $description is not executable" $YELLOW
        fi

        # Syntax validation
        validate_syntax "$file" "$description" "shell"

        # Check for error handling
        if grep -q "set -e\|set -o errexit" "$file"; then
            print_color "✅ $description includes error handling" $GREEN
        else
            print_color "⚠️ $description doesn't include error handling" $YELLOW
        fi
    fi
done

# Section 6: Database Configuration
print_section "6. Database Configuration"

database_files=(
    "src/config/aws-databases.ts:AWS Managed Services Config"
    "src/config/database.ts:PostgreSQL Config"
    "src/config/mongodb.ts:MongoDB Config"
    "src/config/redis.ts:Redis Config"
    "src/config/elasticsearch.ts:Elasticsearch Config"
)

for file_check in "${database_files[@]}"; do
    IFS=':' read -r file description <<< "$file_check"
    ((TOTAL_CHECKS++))
    if validate_file "$file" "$description"; then
        ((PASSED_CHECKS++))

        # Check for environment variable usage
        if grep -q "process\.env\|env\." "$file"; then
            print_color "✅ $description uses environment variables" $GREEN
        fi
    fi
done

# Section 7: Documentation
print_section "7. Documentation"

doc_files=(
    "DEPLOYMENT.md:Deployment Guide"
    "README.md:Project Documentation"
)

for file_check in "${doc_files[@]}"; do
    IFS=':' read -r file description <<< "$file_check"
    ((TOTAL_CHECKS++))
    if validate_file "$file" "$description"; then
        ((PASSED_CHECKS++))

        # Check word count (basic documentation quality check)
        word_count=$(wc -w < "$file" 2>/dev/null || echo "0")
        if [ "$word_count" -gt 500 ]; then
            print_color "✅ $description is comprehensive (${word_count} words)" $GREEN
        elif [ "$word_count" -gt 100 ]; then
            print_color "✅ $description has adequate content (${word_count} words)" $GREEN
        else
            print_color "⚠️ $description seems too brief (${word_count} words)" $YELLOW
        fi
    fi
done

# Section 8: Additional Checks
print_section "8. Additional Quality Checks"

# Check for .gitignore
((TOTAL_CHECKS++))
if [ -f ".gitignore" ]; then
    if grep -q "node_modules\|dist\|\.env\|logs" .gitignore; then
        print_color "✅ .gitignore excludes common files" $GREEN
        ((PASSED_CHECKS++))
    else
        print_color "⚠️ .gitignore might be missing some exclusions" $YELLOW
    fi
else
    print_color "❌ .gitignore file not found" $RED
fi

# Check package.json for deployment scripts
((TOTAL_CHECKS++))
if [ -f "package.json" ]; then
    if grep -q "\"build\"\|\"start\"" package.json; then
        print_color "✅ package.json includes build/start scripts" $GREEN
        ((PASSED_CHECKS++))
    else
        print_color "⚠️ package.json might be missing build/start scripts" $YELLOW
    fi
fi

# Check for TypeScript configuration
((TOTAL_CHECKS++))
if [ -f "tsconfig.json" ]; then
    if grep -q "\"outDir\"\|\"declaration\"\|\"sourceMap\"" tsconfig.json; then
        print_color "✅ TypeScript configuration is production-ready" $GREEN
        ((PASSED_CHECKS++))
    else
        print_color "⚠️ TypeScript configuration might need production settings" $YELLOW
    fi
fi

# Results Summary
echo ""
print_section "Validation Results"

if [ $PASSED_CHECKS -eq $TOTAL_CHECKS ]; then
    print_color "🎉 All $TOTAL_CHECKS checks passed!" $GREEN
    print_color "✅ Deployment configuration is ready for production" $GREEN
    exit 0
elif [ $PASSED_CHECKS -gt $((TOTAL_CHECKS * 80 / 100)) ]; then
    print_color "✅ $PASSED_CHECKS/$TOTAL_CHECKS checks passed - Good" $GREEN
    print_color "⚠️ Consider addressing the warnings before production deployment" $YELLOW
    exit 0
else
    print_color "❌ Only $PASSED_CHECKS/$TOTAL_CHECKS checks passed" $RED
    print_color "❌ Please fix the critical issues before deployment" $RED
    exit 1
fi