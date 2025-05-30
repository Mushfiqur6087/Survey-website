#!/bin/bash

# Survey Website Setup Script
# This script helps you set up the entire Survey Website application

set -e  # Exit on any error

echo "🚀 Survey Website Setup Script"
echo "================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Java
    if command_exists java; then
        JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
        if [ "$JAVA_VERSION" -ge 17 ]; then
            print_success "Java $JAVA_VERSION found"
        else
            print_error "Java 17+ required, found Java $JAVA_VERSION"
            exit 1
        fi
    else
        print_error "Java not found. Please install Java 17+"
        exit 1
    fi
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 18 ]; then
            print_success "Node.js v$(node -v) found"
        else
            print_error "Node.js 18+ required, found v$(node -v)"
            exit 1
        fi
    else
        print_error "Node.js not found. Please install Node.js 18+"
        exit 1
    fi
    
    # Check Python
    if command_exists python3; then
        PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
        print_success "Python $PYTHON_VERSION found"
    else
        print_error "Python 3 not found. Please install Python 3.8+"
        exit 1
    fi
    
    # Check PostgreSQL
    if command_exists psql; then
        print_success "PostgreSQL found"
    else
        print_warning "PostgreSQL not found. Please install PostgreSQL 12+"
        echo "Installation commands:"
        echo "  Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
        echo "  macOS: brew install postgresql"
        echo "  Then start the service and create the database"
    fi
    
    # Check Maven
    if command_exists mvn; then
        print_success "Maven found"
    else
        print_warning "Maven not found. Using Maven wrapper (./mvnw)"
    fi
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    if command_exists psql; then
        # Check if database exists
        if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw surveydb; then
            print_success "Database 'surveydb' already exists"
        else
            print_status "Creating database 'surveydb'..."
            sudo -u postgres createdb surveydb
            print_success "Database 'surveydb' created"
        fi
        
        # Create user if not exists
        sudo -u postgres psql -c "CREATE USER IF NOT EXISTS postgres WITH PASSWORD 'postgres';" 2>/dev/null || true
        sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE surveydb TO postgres;" 2>/dev/null || true
    else
        print_warning "PostgreSQL not available. Please set up database manually."
    fi
}

# Setup Python environment
setup_python() {
    print_status "Setting up Python environment..."
    
    cd Dataset/
    
    # Install Python dependencies
    print_status "Installing Python dependencies..."
    pip3 install --user pandas tabulate seaborn matplotlib scipy numpy
    
    # Try to install tti_dataset_tools
    if pip3 install --user tti_dataset_tools; then
        print_success "tti_dataset_tools installed successfully"
    else
        print_warning "Failed to install tti_dataset_tools. You may need to install it manually."
        print_warning "Please ensure you have access to this library or contact the maintainers."
    fi
    
    cd ..
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd Backend/
    
    # Make mvnw executable
    chmod +x mvnw
    
    # Clean and install dependencies
    print_status "Installing backend dependencies..."
    ./mvnw clean install -DskipTests
    
    print_success "Backend setup complete"
    cd ..
}

# Setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd frontend/
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    print_success "Frontend setup complete"
    cd ..
}

# Process sample data (if available)
process_data() {
    print_status "Checking for data processing..."
    
    cd Dataset/
    
    if [ -f "export_data.py" ]; then
        print_warning "Data processing script found but requires configuration."
        print_warning "Please update the 'dataDir' path in export_data.py to point to your trajectory data."
        print_warning "Then run: python3 export_data.py"
    fi
    
    cd ..
}

# Main setup function
main() {
    echo "This script will help you set up the Survey Website application."
    echo "Please ensure you have the required prerequisites installed."
    echo ""
    
    check_prerequisites
    echo ""
    
    setup_database
    echo ""
    
    setup_python
    echo ""
    
    setup_backend
    echo ""
    
    setup_frontend
    echo ""
    
    process_data
    echo ""
    
    print_success "🎉 Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Configure your trajectory data path in Dataset/export_data.py"
    echo "2. Run data processing: cd Dataset && python3 export_data.py"
    echo "3. Start the backend: cd Backend && ./mvnw spring-boot:run"
    echo "4. Start the frontend: cd frontend && npm run dev"
    echo "5. Open http://localhost:3000 in your browser"
    echo ""
    echo "For detailed instructions, see README.md"
}

# Run main function
main "$@"
