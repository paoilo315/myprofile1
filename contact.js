const supabaseUrl = "https://npgwvbgyfxptkkcondav.supabase.co";
const supabaseKey = "sb_publishable_Sl97ODLF3RzUhsaOBkBctA_D8dYpqno";

// Create client
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Wait for DOM to load
document.addEventListener("DOMContentLoaded", () => {
const form = document.getElementById("contactForm");

form.addEventListener("submit", async (e) => {
e.preventDefault();

```
// Get values
const name = document.getElementById("name").value;
const email = document.getElementById("email").value;
const contact = document.getElementById("contact").value;
const message = document.getElementById("message").value;

try {
  const { data, error } = await supabase
    .from("messages")
    .insert([
      {
        name: name,
        email: email,
        contact: contact,
        message: message,
      },
    ]);

  if (error) {
    console.error("Supabase error:", error);
    alert("❌ Failed to send message");
  } else {
    alert("✅ Message sent successfully!");

    // Reset form
    form.reset();
  }
} catch (err) {
  console.error("Unexpected error:", err);
  alert("⚠️ Something went wrong");
}
```

});
});
