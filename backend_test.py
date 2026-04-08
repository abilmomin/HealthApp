import requests
import sys
from datetime import datetime

class HealthmaxAPITester:
    def __init__(self, base_url="https://fittrack-hub-94.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.content:
                    try:
                        resp_data = response.json()
                        print(f"   Response: {resp_data}")
                    except:
                        print(f"   Response: {response.text[:200]}")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")

            return success, response.json() if response.content and 'application/json' in response.headers.get('content-type', '') else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        return self.run_test("API Health Check", "GET", "", 200)

    def test_exercises_no_auth(self):
        """Test exercises endpoint without auth (should work)"""
        return self.run_test("Exercises Library (No Auth)", "GET", "exercises", 200)

    def test_auth_sync_no_token(self):
        """Test auth sync without token (should return 401)"""
        return self.run_test("Auth Sync (No Token)", "POST", "auth/sync", 401, data={"display_name": "Test"})

    def test_workouts_no_auth(self):
        """Test workouts endpoint without auth (should return 401)"""
        return self.run_test("Workouts (No Auth)", "GET", "workouts", 401)

    def test_nutrition_search_no_auth(self):
        """Test nutrition search without auth (should return 401)"""
        return self.run_test("Nutrition Search (No Auth)", "GET", "nutrition/search?q=chicken", 401)

    def test_goals_no_auth(self):
        """Test goals endpoint without auth (should return 401)"""
        return self.run_test("Goals (No Auth)", "GET", "goals", 401)

    def test_social_feed_no_auth(self):
        """Test social feed without auth (should return 401)"""
        return self.run_test("Social Feed (No Auth)", "GET", "social/feed", 401)

    def test_dashboard_stats_no_auth(self):
        """Test dashboard stats without auth (should return 401)"""
        return self.run_test("Dashboard Stats (No Auth)", "GET", "stats/dashboard", 401)

    def test_streaks_no_auth(self):
        """Test streaks endpoint without auth (should return 401)"""
        return self.run_test("Streaks (No Auth)", "GET", "stats/streaks", 401)

    def test_exercises_with_query(self):
        """Test exercises endpoint with search query (should work without auth)"""
        return self.run_test("Exercises with Query (bench)", "GET", "exercises?q=bench", 200)

    def test_exercises_with_muscle_group(self):
        """Test exercises endpoint with muscle group filter (should work without auth)"""
        return self.run_test("Exercises with Muscle Group (Chest)", "GET", "exercises?muscle_group=Chest", 200)

    def test_exercises_bodyparts(self):
        """Test exercises bodyparts endpoint (should work without auth)"""
        return self.run_test("Exercises Body Parts", "GET", "exercises/bodyparts", 200)

def main():
    print("🏃‍♂️ Starting Healthmax API Tests...")
    print("=" * 50)
    
    tester = HealthmaxAPITester()

    # Test API health check
    tester.test_health_check()

    # Test public endpoint (no auth required)
    tester.test_exercises_no_auth()

    # Test exercise-related endpoints (no auth required)
    tester.test_exercises_with_query()
    tester.test_exercises_with_muscle_group()
    tester.test_exercises_bodyparts()

    # Test protected endpoints (should return 401 without auth)
    tester.test_auth_sync_no_token()
    tester.test_workouts_no_auth()
    tester.test_nutrition_search_no_auth()
    tester.test_goals_no_auth()
    tester.test_social_feed_no_auth()
    tester.test_dashboard_stats_no_auth()
    tester.test_streaks_no_auth()

    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())