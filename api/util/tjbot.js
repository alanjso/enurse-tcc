const TJBot = require('tjbot');

console.log(TJBot.CAPABILITIES);

const tj = new TJBot({
    robot: {
        gender: TJBot.GENDERS.FEMALE
    },
    speak: {
        language: TJBot.LANGUAGES.SPEAK.PORTUGUESE
    }
});

tj.initialize([TJBot.HARDWARE.LED_NEOPIXEL, TJBot.HARDWARE.SERVO, TJBot.HARDWARE.MICROPHONE, TJBot.HARDWARE.SPEAKER]);
