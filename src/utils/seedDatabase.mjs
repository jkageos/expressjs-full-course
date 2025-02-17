import { faker } from "@faker-js/faker";
import "dotenv/config";
import mongoose from "mongoose";
import { Blog } from "../mongoose/schemas/blog.mjs";
import { Comment } from "../mongoose/schemas/comment.mjs";
import { Tag } from "../mongoose/schemas/tag.mjs";
import { User } from "../mongoose/schemas/user.mjs";
import { hashPassword } from "./helpers.mjs";

mongoose.connect(
  `${process.env.MONGO_DB_URI}/${process.env.MONGO_DB_NAME}?authSource=admin`
);

const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Blog.deleteMany({});
    await Tag.deleteMany({});
    await Comment.deleteMany({});

    // Create users
    const users = [];
    const adminUsers = [];
    for (let i = 0; i < 10; i++) {
      const isAdmin = i < 3; // Make the first 3 users admins
      const user = new User({
        username: faker.internet.userName(),
        email: faker.internet.email(),
        password: hashPassword("password123"),
        isAdmin: isAdmin,
      });
      const savedUser = await user.save();
      users.push(savedUser);
      if (isAdmin) {
        adminUsers.push(savedUser);
      }
    }

    // Create tags
    const tags = [];
    for (let i = 0; i < 5; i++) {
      const tag = new Tag({
        name: faker.word.noun(),
      });
      tags.push(await tag.save());
    }

    // Create blogs (only by admin users)
    const blogs = [];
    for (let i = 0; i < 20; i++) {
      const blog = new Blog({
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(),
        author: adminUsers[Math.floor(Math.random() * adminUsers.length)]._id,
        estimatedReadTime: faker.number.int({ min: 1, max: 30 }),
        picture: faker.image.url(),
        video: faker.internet.url(),
        upvotes: 0, // Start with 0 upvotes
        tags: faker.helpers
          .arrayElements(tags, faker.number.int({ min: 1, max: 3 }))
          .map((tag) => tag._id),
      });
      blogs.push(await blog.save());
    }

    // Create comments
    const comments = [];
    for (let i = 0; i < 50; i++) {
      const comment = new Comment({
        content: faker.lorem.paragraph(),
        author: users[Math.floor(Math.random() * users.length)]._id,
        blog: blogs[Math.floor(Math.random() * blogs.length)]._id,
        parentComment: i > 10 ? faker.helpers.arrayElement([null, ...comments.map(c => c._id)]) : null,
      });
      const savedComment = await comment.save();
      comments.push(savedComment);
    }

    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    mongoose.connection.close();
  }
};

seedDatabase();
