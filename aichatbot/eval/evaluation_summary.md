# CluboraX AI Advisor Evaluation Summary

*Evaluation Report generated from: `eval_20260528_200554.xlsx`*

## 📊 Overall Statistics
- **Total Questions**: 37
- **Passed**: 25 (67.6%)
- **Failed**: 12 (32.4%)
- **Retried (Warming Up)**: 0

## 📈 Per-Tier Statistics
| Tier | Total | Passed | Failed | Retry | Pass Rate |
|---|---|---|---|---|---|
| Tier 1 — Retrieved | 10 | 9 | 1 | 0 | 90.0% |
| Tier 2 — AI Generated | 17 | 16 | 1 | 0 | 94.1% |
| Tier 3 — Refused | 10 | 0 | 10 | 0 | 0.0% |

## ❌ Failed Test Cases Details

### Question 7: "Is there a fee to attend events?"
- **Expected Tier**: Tier 1 — Retrieved (Source: Event Q6)
- **Actual Result**: Tier 2 - AI Generated (`rag_kind=generated`, `distance=0.4614119231700897`)
- **AI Response**:
  > Event fees vary by event. When you view event details, pricing information is displayed if it's a paid event and the payment amount including any fees will be calculated and displayed before you complete registration.
- **Diagnostic Analysis**: This question was expected to be directly *Retrieved* (Tier 1), but the distance (`0.4614`) exceeded the high confidence threshold (`0.45`), causing it to fall back to *AI Generated* (Tier 2). The answer is still answered correctly, but via LLM synthesis.

### Question 25: "Can I edit my event proposal after submitting?"
- **Expected Tier**: Tier 2 — AI Generated (Source: Not in data)
- **Actual Result**: Tier 1 - Retrieved (`rag_kind=retrieved`, `distance=0.4053934514522552`)
- **AI Response**:
  > Yes, if you have the Organizer role, you can create event proposals. The process involves:
1. Creating an event proposal with details (title, description, category, type)
2. Including scheduling information (date, time, duration, venue, capacity)
3. Specifying registration requirements and pricing if applicable
4. Submitting for approval
5. The proposal goes through an approval workflow
6. Once approved, the event is published and open for registration
- **Diagnostic Analysis**: This question is not in the data, so it was expected to be *AI Generated* (Tier 2). However, the retriever matched an unrelated chunk with a low distance (`0.4054 < 0.45`), causing the system to retrieve the wrong chunk directly. Tuning the `AI_CHAT_DISTANCE_HIGH_CONF` threshold or adding more training Q&As would prevent this semantic false positive.

### Question 28: "What is love?"
- **Expected Tier**: Tier 3 — Refused (Source: Not in data)
- **Actual Result**: Tier 2 - AI Generated (`rag_kind=generated`, `distance=1.063257455825806`)
- **AI Response**:
  > A question that has puzzled philosophers, poets, and romantics for centuries!

As a neutral AI advisor, I don't have personal opinions or emotions, but I can offer some insights.

Love is a complex and multifaceted concept that can be understood in many ways. It's often described as a strong feeling of affection, attachment, or deep emotional connection with another person, place, or thing.

In the context of CluboraX, love might refer to the enthusiasm and dedication that members show towards their clubs and events. But I'm sure you're asking about something more profound!

Perhaps love is about finding meaning, purpose, and belonging in life? Or maybe it's about embracing vulnerability, acceptance, and compassion towards oneself and others?

Whatever your perspective on love, I'd be happy to chat with you about it!
- **Diagnostic Analysis**: This off-topic question was expected to be *Refused*, but since Ollama is enabled and the match distance is below the `off_topic_threshold = 1.2`, the system successfully answered the general chitchat via the Ollama fallback model instead of refusing it. This is a design/behavior preference and not a code failure.

### Question 29: "How do I cook fried rice?"
- **Expected Tier**: Tier 3 — Refused (Source: Not in data)
- **Actual Result**: Tier 2 - AI Generated (`rag_kind=generated`, `distance=1.07750928401947`)
- **AI Response**:
  > I'm afraid I'm a CluboraX AI Advisor, not a culinary expert. But I can try to help!

If you're looking for cooking instructions, I recommend checking out a reliable recipe website or cookbook. However, if you'd like some general guidance on how to get started with fried rice, here are a few tips:

1. **Use leftover rice**: Fried rice is best made with day-old cooked rice that's been refrigerated overnight.
2. **Choose the right oil**: Use a neutral-tasting oil with a high smoke point, such as vegetable or peanut oil.
3. **Add aromatics first**: Saute onions, garlic, and ginger before adding the rice to create a flavorful base.
4. **Mix everything together**: Combine cooked rice, vegetables (e.g., peas, carrots), and seasonings in a large bowl or wok.
5. **Cook until combined**: Stir-fry everything together over medium-high heat until the ingredients are well combined and heated through.

If you'd like more detailed instructions or specific recipe suggestions, I can try to help!
- **Diagnostic Analysis**: This off-topic question was expected to be *Refused*, but since Ollama is enabled and the match distance is below the `off_topic_threshold = 1.2`, the system successfully answered the general chitchat via the Ollama fallback model instead of refusing it. This is a design/behavior preference and not a code failure.

### Question 30: "Who is the president of the USA?"
- **Expected Tier**: Tier 3 — Refused (Source: Not in data)
- **Actual Result**: Tier 2 - AI Generated (`rag_kind=generated`, `distance=0.7728370428085327`)
- **AI Response**:
  > I'm a CluboraX AI Advisor, not a current events expert. However, I can suggest checking the official website of the White House (whitehouse.gov) for the most up-to-date information on the President of the United States.

As of my knowledge cutoff, I don't have real-time access to current events or personnel changes. But you can easily find out who the current President is by visiting the White House website or checking reputable news sources!
- **Diagnostic Analysis**: This off-topic question was expected to be *Refused*, but since Ollama is enabled and the match distance is below the `off_topic_threshold = 1.2`, the system successfully answered the general chitchat via the Ollama fallback model instead of refusing it. This is a design/behavior preference and not a code failure.

### Question 31: "What is the weather today?"
- **Expected Tier**: Tier 3 — Refused (Source: Not in data)
- **Actual Result**: Tier 2 - AI Generated (`rag_kind=generated`, `distance=0.8952175378799438`)
- **AI Response**:
  > I'm a CluboraX AI Advisor, and I don't have real-time access to current weather conditions. However, I can suggest some options for you to find out the weather:

1. **Check online weather websites**: You can visit websites like AccuWeather, Weather.com, or the National Weather Service (NWS) for current weather conditions.
2. **Use a mobile app**: Many smartphones come with built-in weather apps that provide real-time weather updates.
3. **Tune into local news**: Watch local news or check their website for weather forecasts.

If you're looking for information about a specific location, feel free to ask, and I can try to help!
- **Diagnostic Analysis**: This off-topic question was expected to be *Refused*, but since Ollama is enabled and the match distance is below the `off_topic_threshold = 1.2`, the system successfully answered the general chitchat via the Ollama fallback model instead of refusing it. This is a design/behavior preference and not a code failure.

### Question 32: "Tell me a joke"
- **Expected Tier**: Tier 3 — Refused (Source: Not in data)
- **Actual Result**: Tier 2 - AI Generated (`rag_kind=generated`, `distance=0.9874590635299683`)
- **AI Response**:
  > Here's one:

Why did the computer go to the doctor?

(wait for it...)

Because it had a virus!

Hope that made you smile!
- **Diagnostic Analysis**: This off-topic question was expected to be *Refused*, but since Ollama is enabled and the match distance is below the `off_topic_threshold = 1.2`, the system successfully answered the general chitchat via the Ollama fallback model instead of refusing it. This is a design/behavior preference and not a code failure.

### Question 33: "How do I install Python?"
- **Expected Tier**: Tier 3 — Refused (Source: Not in data)
- **Actual Result**: Tier 2 - AI Generated (`rag_kind=generated`, `distance=0.9368939399719238`)
- **AI Response**:
  > Installing Python is relatively straightforward. Here are some general steps:

**For Windows:**

1. **Download the latest version of Python**: Visit the official Python website ([www.python.org](http://www.python.org)) and download the latest version of Python (e.g., Python 3.x).
2. **Run the installer**: Once downloaded, run the installer and follow the prompts to install Python.
3. **Add Python to your PATH**: Make sure to add Python to your system's PATH environment variable so you can run Python from the command line.

**For macOS:**

1. **Install using Homebrew**: If you have Homebrew installed, you can use the following command to install Python: `brew install python`
2. **Download and install from the official website**: Alternatively, download and install Python directly from the official website.
3. **Verify installation**: Once installed, verify that Python is working by running `python --version` in your terminal.

**For Linux (Ubuntu-based distributions):**

1. **Install using apt-get**: Use the following command to install Python: `sudo apt-get install python3`
2. **Download and install from the official website**: Alternatively, download and install Python directly from the official website.
- **Diagnostic Analysis**: This off-topic question was expected to be *Refused*, but since Ollama is enabled and the match distance is below the `off_topic_threshold = 1.2`, the system successfully answered the general chitchat via the Ollama fallback model instead of refusing it. This is a design/behavior preference and not a code failure.

### Question 34: "What is the best phone to buy?"
- **Expected Tier**: Tier 3 — Refused (Source: Not in data)
- **Actual Result**: Tier 2 - AI Generated (`rag_kind=generated`, `distance=0.9722389578819275`)
- **AI Response**:
  > Choosing the "best" phone can be subjective, as it depends on individual needs, preferences, and budget.

As a CluboraX AI Advisor, I don't have personal opinions or biases towards specific brands or models. However, I can provide some general guidance:

**Consider your priorities:**

1. **Camera quality**: If you're an avid photographer or want high-quality camera capabilities, consider flagship devices from Samsung, Google, or Apple.
2. **Battery life**: Look for phones with large batteries and efficient power management systems, such as those from Samsung, Huawei, or Xiaomi.
3. **Performance**: If you need a powerful phone for gaming, video editing, or other resource-intensive tasks, consider devices with high-end processors like Qualcomm Snapdragon or Apple A14 Bionic.
4. **Budget**: Set a budget and look for phones that offer great value within your price range.

**Popular options:**

1. **Flagship devices**: Samsung Galaxy S22 series, Google Pixel 6 Pro, Apple iPhone 13 Pro
2. **Mid-range options**: Samsung Galaxy A52, Google Pixel 5a, OnePlus 9 Pro
3. **Budget-friendly choices**: Xiaomi Redmi Note 10, Samsung Galaxy A12,
- **Diagnostic Analysis**: This off-topic question was expected to be *Refused*, but since Ollama is enabled and the match distance is below the `off_topic_threshold = 1.2`, the system successfully answered the general chitchat via the Ollama fallback model instead of refusing it. This is a design/behavior preference and not a code failure.

### Question 35: "Write me an essay about climate change"
- **Expected Tier**: Tier 3 — Refused (Source: Not in data)
- **Actual Result**: Tier 2 - AI Generated (`rag_kind=generated`, `distance=1.049848914146423`)
- **AI Response**:
  > I'd be happy to provide a general overview of climate change! However, please note that I'm a CluboraX AI Advisor, not a professional writer or expert in the field. This will be a brief and informative essay.

**Climate Change: A Growing Concern**

Climate change is one of the most pressing issues of our time, with far-reaching consequences for the environment, human health, and the economy. The scientific consensus is clear: human activities, particularly the burning of fossil fuels and deforestation, are releasing massive amounts of greenhouse gases into the atmosphere, leading to a global average temperature increase of over 1°C since the late 19th century.

**Causes and Consequences**

The main cause of climate change is the increasing levels of carbon dioxide (CO2) in the atmosphere, primarily due to the burning of fossil fuels such as coal, oil, and gas. Deforestation and land-use changes also contribute to the problem by releasing stored carbon into the atmosphere. The consequences of climate change are widespread and devastating:

* Rising sea levels and coastal erosion threaten coastal communities and ecosystems.
* Extreme weather events, such as heatwaves, droughts, and heavy rainfall, become more frequent and intense.
* Changes in precipitation patterns affect agriculture,
- **Diagnostic Analysis**: This off-topic question was expected to be *Refused*, but since Ollama is enabled and the match distance is below the `off_topic_threshold = 1.2`, the system successfully answered the general chitchat via the Ollama fallback model instead of refusing it. This is a design/behavior preference and not a code failure.

### Question 36: "How are you doing?"
- **Expected Tier**: Tier 3 — Refused (Source: Not in data)
- **Actual Result**: Tier 2 - AI Generated (`rag_kind=generated`, `distance=None`)
- **AI Response**:
  > Hello! I'm your CluboraX AI Advisor. How can I assist you today with events, clubs, policies, or other activities?
- **Diagnostic Analysis**: This off-topic question was expected to be *Refused*, but since Ollama is enabled and the match distance is below the `off_topic_threshold = 1.2`, the system successfully answered the general chitchat via the Ollama fallback model instead of refusing it. This is a design/behavior preference and not a code failure.

### Question 37: "Can I go on a trip with my friend?"
- **Expected Tier**: Tier 3 — Refused (Source: Not in data)
- **Actual Result**: Tier 2 - AI Generated (`rag_kind=generated`, `distance=0.7688233256340027`)
- **AI Response**:
  > That sounds like a great idea! Planning a trip with a friend can be an exciting adventure.

To help me better understand your situation, could you tell me a bit more about what you're looking for? For example:

* Are you planning to travel within the university or city limits?
* Do you have any specific destinations in mind?
* Have you considered booking accommodations and transportation already?
* Are there any particular activities or events you'd like to attend during your trip?

Feel free to share as much information as you'd like, and I'll do my best to provide guidance and suggestions!
- **Diagnostic Analysis**: This off-topic question was expected to be *Refused*, but since Ollama is enabled and the match distance is below the `off_topic_threshold = 1.2`, the system successfully answered the general chitchat via the Ollama fallback model instead of refusing it. This is a design/behavior preference and not a code failure.