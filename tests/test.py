from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
import chromedriver_autoinstaller
import os
import time

# Get paths figured out
script_directory = os.path.dirname(os.path.abspath(__file__))

# Ensure the chrome driver is installed
chromedriver_autoinstaller.install()

# Set parameters
test_port = 3000
homepage = "http://localhost:" + str(test_port)
editpage = "http://localhost:" + str(test_port) + "/edit"
chrome_options = Options()
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--headless")
chrome_options.add_argument("--disable-dev-shm-usage")

# Initialize chrome webdriver
web = webdriver.Chrome(chrome_options)

# Get the main pages to ensure it's up and running
web.get(homepage)
web.get(editpage)

# Set test button parameters
tButton_text = "Test Button"
tButton_text_color = "#9BBBBB"
tButton_color = "#000000"
tButton_image_path = os.path.join(os.path.dirname(script_directory), "node", "public", "images", "test_button_image.png")
tButton_link = "https://google.com"

#
# Test adding buttons
#


# Submit the button
web.find_element(By.ID, "buttonText").send_keys(tButton_text)
web.find_element(By.ID, "text_color").send_keys(tButton_text_color)
web.find_element(By.ID, "buttonColor").send_keys(tButton_color)
web.find_element(By.ID, "imageUpload").send_keys(tButton_image_path)
web.find_element(By.ID, "link").send_keys(tButton_link)
web.find_element(By.ID, "submitButton").click()

# Wait for the alert and dismiss it
alert = WebDriverWait(web, 10).until(EC.alert_is_present())
assert "Button added" == alert.text
alert.accept() # This should redirect to the home page.
time.sleep(2)

# Confirm the button was added
assert tButton_text in web.page_source

# 
# Test deleting buttons
# 

# Head back to the edit page and test deleting the button.
web.get(editpage)
delete_select = Select(web.find_element(By.ID, "delete_select"))
options = [option.text for option in delete_select.options]
# Confirm that the delete button select element actually has our test button as an option
assert tButton_text in options
# Select and delete our test button
delete_select.select_by_visible_text(tButton_text)
web.find_element(By.ID, "submit_button_delete").click()
# Wait for the alert and accept to confirm the deletion of the button
alert = WebDriverWait(web, 10).until(EC.alert_is_present())
alert.accept()
alert = WebDriverWait(web, 10).until(EC.alert_is_present())
assert "Button deleted" == alert.text
alert.accept()
web.get(homepage)
# confirm the button was deleted successfully.
assert not tButton_text in web.page_source

print("hold")