#!/bin/bash

# Script to run all integration tests (backend and frontend)
# Usage: ./run-all-tests.sh

set -e  # Exit on error

echo "🧪 Running All Integration Tests"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print section header
print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Function to run backend tests
run_backend_tests() {
    print_section "📦 Backend Integration Tests"
    cd backend
    
    echo "Running backend integration tests..."
    npm test -- tests/integration/ --verbose
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backend integration tests passed!${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend integration tests had some failures${NC}"
        return 1
    fi
    
    cd ..
}

# Function to run frontend tests
run_frontend_tests() {
    print_section "🎨 Frontend E2E Tests"
    cd frontend
    
    echo "Running frontend e2e tests..."
    npm run test:e2e
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Frontend e2e tests passed!${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend e2e tests had some failures${NC}"
        return 1
    fi
    
    cd ..
}

# Main execution
main() {
    START_TIME=$(date +%s)
    
    echo -e "${GREEN}Starting test suite...${NC}"
    echo ""
    
    # Run backend tests
    if ! run_backend_tests; then
        BACKEND_FAILED=true
    fi
    
    # Run frontend tests
    if ! run_frontend_tests; then
        FRONTEND_FAILED=true
    fi
    
    # Summary
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    print_section "📊 Test Summary"
    
    if [ -z "$BACKEND_FAILED" ] && [ -z "$FRONTEND_FAILED" ]; then
        echo -e "${GREEN}✅ All tests passed!${NC}"
        echo ""
        echo "Duration: ${DURATION}s"
        exit 0
    else
        echo -e "${YELLOW}⚠️  Some tests failed:${NC}"
        [ -n "$BACKEND_FAILED" ] && echo "  - Backend integration tests"
        [ -n "$FRONTEND_FAILED" ] && echo "  - Frontend e2e tests"
        echo ""
        echo "Duration: ${DURATION}s"
        exit 1
    fi
}

# Run main function
main

