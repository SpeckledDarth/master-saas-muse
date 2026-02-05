#!/bin/bash

# Install Playwright browsers if not already installed
npx playwright install chromium --with-deps 2>/dev/null

# Run all tests
echo "Running Playwright tests..."
npx playwright test "$@"

# Show report if tests completed
if [ $? -eq 0 ]; then
  echo "All tests passed!"
else
  echo "Some tests failed. Run 'npx playwright show-report' to view the report."
fi
