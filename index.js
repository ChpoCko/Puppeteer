import puppeteer from "puppeteer";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const sendTelegramMessage = async (message) => {
  const url = `https://api.telegram.org/bot${process.env.API_KEY}/sendMessage`;
  const data = {
    chat_id: process.env.CHAT_ID,
    text: message,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      console.log("Telegram notification sent successfully.");
    } else {
      console.error("Failed to send Telegram notification.");
    }
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
  }
};

async function checkStockAndNotify() {
  const browser = await puppeteer.launch({
    headless: "new",
  });
  const page = await browser.newPage();

  try {
    await page.goto(process.env.URL_TO_WATCH, {
      waitUntil: "domcontentloaded",
    });

    // Find the parent element based on the provided selector.
    const parentElement = await page.$(process.env.PARENT_ELEMENT_SELECTOR);

    if (parentElement) {
      // Get the text content of the parent element.
      const availabilityText = await page.evaluate(
        (element) => element.querySelector("span").textContent,
        parentElement
      );

      if (availabilityText !== "Ei varastossa") {
        sendTelegramMessage("4090 is in stock!!!");
      } else if (availabilityText === "Ei varastossa") {
        sendTelegramMessage("4090 is not in stock");
      }
    } else {
      console.log("Parent element not found. Check your selector.");
    }
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    await browser.close();
  }
}

// Set up a recurring interval to check for stock status.
setInterval(checkStockAndNotify, Number(process.env.REFRESH_INTERVAL_MS));
