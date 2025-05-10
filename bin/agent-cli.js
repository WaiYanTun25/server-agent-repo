#!/usr/bin/env node

import axios from "axios"; // Change to import
import inquirer from "inquirer"; // Change to import
import fs from "fs"; // Change to import
import { exec } from "child_process"; // Change to import
import { Command } from "commander"; // Already using ES module import
const program = new Command();

// Global settings
const API_URL = "https://your-saas-app.com/api"; // Your NestJS API endpoint
const CONFIG_FILE = "./config.json"; // Save the config (API key) to this file

// Utility to load config from a file
function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG_FILE));
  }
  return null;
}

// Utility to save config to a file
function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config));
}

async function validateAPIKey(apiKey) {
  try {
    const response = await axios.post(`${API_URL}/validate-api-key`, {
      apiKey,
    });
    if (response.data.valid) {
      return response.data;
    } else {
      throw new Error("Invalid API Key");
    }
  } catch (error) {
    console.error("Error validating API key:", error.message);
    return null;
  }
}

async function startAgent() {
  console.log("Agent is working...");
  setInterval(() => {
    console.log("Checking server status...");

    // Check Apache status
    exec("systemctl is-active apache2", (error, stdout, stderr) => {
      if (error) {
        console.error(`Apache check error: ${error.message}`);
        return;
      }

      if (stderr) {
        console.error(`Apache stderr: ${stderr}`);
        return;
      }

      const status = stdout.trim();
      if (status === "active") {
        console.log("✅ Apache is running.");
      } else {
        console.log("❌ Apache is not running.");
      }
    });
  }, 60000);
}

async function configureAgent() {
  const config = loadConfig();

  if (config && config.apiKey) {
    console.log(
      `Your API key is already configured. It is valid until: ${config.validUntil}`
    );
    return;
  }

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "apiKey",
      message: "Please enter your API key:",
    },
  ]);

  const validationResponse = await validateAPIKey(answers.apiKey);

  if (validationResponse) {
    saveConfig({
      apiKey: answers.apiKey,
      validUntil: validationResponse.validUntil,
    });
    console.log(`API key is valid until ${validationResponse.validUntil}.`);
    console.log("Configuration successful!");
  } else {
    console.log("Invalid API key. Please try again.");
  }
}

program
  .command("start")
  .description("Start the server agent")
  .action(startAgent);

program
  .command("configure")
  .description("Configure the agent with your API key")
  .action(configureAgent);

program.parse(process.argv);
