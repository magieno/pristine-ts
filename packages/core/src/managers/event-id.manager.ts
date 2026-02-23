import {injectable, inject} from "tsyringe";
import {CoreModuleKeyname} from "../core.module.keyname";
import {EventIdGenerationStyleEnum} from "../enums/event-id-generation-style.enum";
import {v4 as uuidv4} from "uuid";

@injectable()
export class EventIdManager {
  private readonly adjectives = [
    "Great", "Small", "Big", "Little", "Fast", "Slow", "Happy", "Sad", "Brave", "Calm",
    "Wild", "Tame", "Loud", "Quiet", "Wise", "Foolish", "Strong", "Weak", "Kind", "Mean",
    "Bright", "Dark", "Sharp", "Dull", "Hard", "Soft", "Rough", "Smooth", "Hot", "Cold",
    "Warm", "Cool", "Dry", "Wet", "Rich", "Poor", "Young", "Old", "New", "Ancient",
    "Clean", "Dirty", "Full", "Empty", "High", "Low", "Deep", "Shallow", "Heavy", "Light",
    "Quick", "Lazy", "Busy", "Idle", "Free", "Bound", "Safe", "Risky", "Sure", "Vague",
    "True", "False", "Real", "Fake", "Pure", "Mixed", "Whole", "Part", "One", "Many",
    "First", "Last", "Best", "Worst", "Top", "Bottom", "Front", "Back", "Left", "Right",
    "North", "South", "East", "West", "Up", "Down", "In", "Out", "On", "Off"
  ];

  private readonly colors = [
    "Red", "Orange", "Yellow", "Green", "Blue", "Indigo", "Violet", "Purple", "Pink", "Black",
    "White", "Gray", "Brown", "Silver", "Gold", "Cyan", "Magenta", "Lime", "Teal", "Maroon",
    "Navy", "Olive", "Coral", "Salmon", "Beige", "Ivory", "Ebony", "Azure", "Crimson", "Amber",
    "Bronze", "Copper", "Emerald", "Jade", "Ruby", "Sapphire", "Topaz", "Opal", "Pearl", "Quartz",
    "Zinc", "Iron", "Steel", "Brass", "Lead", "Tin", "Nickel", "Chrome", "Neon", "Pastel",
    "Dark", "Light", "Pale", "Deep", "Bright", "Faint", "Clear", "Cloudy", "Sunny", "Rainy",
    "Snowy", "Windy", "Stormy", "Foggy", "Misty", "Hazy", "Smoky", "Dusty", "Sandy", "Muddy",
    "Rocky", "Grassy", "Leafy", "Woody", "Mossy", "Icy", "Frosty", "Dewy", "Wet", "Dry"
  ];

  private readonly animals = [
    "Lion", "Tiger", "Bear", "Wolf", "Fox", "Dog", "Cat", "Mouse", "Rat", "Cow",
    "Pig", "Sheep", "Goat", "Horse", "Zebra", "Deer", "Elk", "Moose", "Bird", "Fish",
    "Shark", "Whale", "Dolphin", "Seal", "Otter", "Penguin", "Eagle", "Hawk", "Owl", "Crow",
    "Raven", "Dove", "Swan", "Duck", "Goose", "Frog", "Toad", "Snake", "Lizard", "Turtle",
    "Spider", "Ant", "Bee", "Wasp", "Fly", "Moth", "Bat", "Crab", "Lobster", "Shrimp",
    "Snail", "Slug", "Worm", "Leech", "Clam", "Oyster", "Squid", "Octopus", "Jellyfish", "Starfish",
    "Urchin", "Coral", "Sponge", "Anemone", "Hydra", "Planarian", "Rotifer", "Nematode", "Tardigrade", "Mite",
    "Tick", "Flea", "Louse", "Bedbug", "Termite", "Roach", "Cricket", "Locust", "Mantis", "Stick"
  ];

  constructor(
    @inject(`%${CoreModuleKeyname}.event_id_generation_style%`) private readonly eventIdGenerationStyleEnum: EventIdGenerationStyleEnum,
  ) {
  }

  generateHumanReadableEventId(): string {
    const adjective = this.adjectives[Math.floor(Math.random() * this.adjectives.length)];
    const color = this.colors[Math.floor(Math.random() * this.colors.length)];
    const animal = this.animals[Math.floor(Math.random() * this.animals.length)];

    return `${adjective}${color}${animal}`;
  }

  generateEventId(): string {
    switch (this.eventIdGenerationStyleEnum) {
      case EventIdGenerationStyleEnum.Uuid:
        return uuidv4();
      case EventIdGenerationStyleEnum.HumanReadable:
        return this.generateHumanReadableEventId();
    }
  }
}