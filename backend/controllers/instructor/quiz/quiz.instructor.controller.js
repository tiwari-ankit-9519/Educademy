import { PrismaClient } from "@prisma/client";
import asyncHandler from "express-async-handler";
import educademyLogger from "../../utils/logger.js";
import { performance } from "perf_hooks";

const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "event",
      level: "error",
    },
    {
      emit: "event",
      level: "info",
    },
    {
      emit: "event",
      level: "warn",
    },
  ],
  errorFormat: "pretty",
});

prisma.$on("query", (e) => {
  const queryLower = (e.query || "").toLowerCase().trim();
  let tableName = "unknown";
  let operation = "QUERY";

  if (queryLower.includes("select")) {
    operation = "SELECT";
    const fromMatch =
      queryLower.match(/from\s+"?(\w+)"?\."?(\w+)"?/i) ||
      queryLower.match(/from\s+"?(\w+)"?/i);
    if (fromMatch) {
      tableName = fromMatch[2] || fromMatch[1];
    }
  } else if (queryLower.includes("insert")) {
    operation = "INSERT";
    const intoMatch =
      queryLower.match(/insert\s+into\s+"?(\w+)"?\."?(\w+)"?/i) ||
      queryLower.match(/insert\s+into\s+"?(\w+)"?/i);
    if (intoMatch) {
      tableName = intoMatch[2] || intoMatch[1];
    }
  } else if (queryLower.includes("update")) {
    operation = "UPDATE";
    const updateMatch =
      queryLower.match(/update\s+"?(\w+)"?\."?(\w+)"?/i) ||
      queryLower.match(/update\s+"?(\w+)"?/i);
    if (updateMatch) {
      tableName = updateMatch[2] || updateMatch[1];
    }
  } else if (queryLower.includes("delete")) {
    operation = "DELETE";
    const deleteMatch =
      queryLower.match(/delete\s+from\s+"?(\w+)"?\."?(\w+)"?/i) ||
      queryLower.match(/delete\s+from\s+"?(\w+)"?/i);
    if (deleteMatch) {
      tableName = deleteMatch[2] || deleteMatch[1];
    }
  }

  educademyLogger.logger.log("info", `DATABASE ${operation}: ${tableName}`, {
    sqlQuery: e.query,
    sqlParams: e.params,
    database: {
      operation: operation.toUpperCase(),
      table: tableName,
      duration: e.duration ? `${e.duration}ms` : null,
    },
  });
});

export const createQuiz = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "QuizController",
    methodName: "createQuiz",
  });

  educademyLogger.logMethodEntry("QuizController", "createQuiz", {
    userId: req.userAuthId,
    sectionId: req.params.sectionId,
    title: req.body.title,
  });

  try {
    const { sectionId } = req.params;
    const {
      title,
      description,
      instructions,
      duration,
      passingScore,
      maxAttempts = 1,
      order,
      isRequired = true,
      randomizeQuestions = false,
      showResults = true,
      allowReview = true,
      questions = [],
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (!duration || duration <= 0) {
      return res.status(400).json({
        success: false,
        message: "Duration must be greater than 0 minutes",
      });
    }

    if (!passingScore || passingScore < 0 || passingScore > 100) {
      return res.status(400).json({
        success: false,
        message: "Passing score must be between 0 and 100",
      });
    }

    if (!maxAttempts || maxAttempts < 1) {
      return res.status(400).json({
        success: false,
        message: "Max attempts must be at least 1",
      });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one question is required",
      });
    }

    const validQuestionTypes = [
      "MULTIPLE_CHOICE",
      "SINGLE_CHOICE",
      "TRUE_FALSE",
      "SHORT_ANSWER",
      "ESSAY",
      "FILL_IN_BLANK",
      "MATCHING",
      "DRAG_DROP",
      "CODE_CHALLENGE",
    ];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];

      if (!question.question?.trim()) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1}: Question text is required`,
        });
      }

      if (!question.type) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1}: Question type is required`,
        });
      }

      if (!validQuestionTypes.includes(question.type)) {
        return res.status(400).json({
          success: false,
          message: `Question ${
            i + 1
          }: Invalid question type. Must be one of: ${validQuestionTypes.join(
            ", "
          )}`,
        });
      }

      if (!question.points || question.points <= 0) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1}: Points must be greater than 0`,
        });
      }

      if (["MULTIPLE_CHOICE", "SINGLE_CHOICE"].includes(question.type)) {
        if (
          !question.options ||
          !Array.isArray(question.options) ||
          question.options.length < 2
        ) {
          return res.status(400).json({
            success: false,
            message: `Question ${
              i + 1
            }: Multiple choice questions must have at least 2 options`,
          });
        }

        const validOptions = question.options.filter((opt) => opt?.trim());
        if (validOptions.length < 2) {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1}: All options must have text content`,
          });
        }

        if (!question.correctAnswer) {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1}: Correct answer is required`,
          });
        }

        if (question.type === "MULTIPLE_CHOICE") {
          const correctAnswers = Array.isArray(question.correctAnswer)
            ? question.correctAnswer
            : [question.correctAnswer];

          const invalidAnswers = correctAnswers.filter(
            (ans) => !question.options.includes(ans)
          );

          if (invalidAnswers.length > 0) {
            return res.status(400).json({
              success: false,
              message: `Question ${
                i + 1
              }: Correct answers must match available options`,
            });
          }
        } else {
          if (!question.options.includes(question.correctAnswer)) {
            return res.status(400).json({
              success: false,
              message: `Question ${
                i + 1
              }: Correct answer must match one of the available options`,
            });
          }
        }
      }

      if (question.type === "TRUE_FALSE") {
        if (
          !["true", "false"].includes(question.correctAnswer?.toLowerCase())
        ) {
          return res.status(400).json({
            success: false,
            message: `Question ${
              i + 1
            }: True/False questions must have 'true' or 'false' as correct answer`,
          });
        }
      }

      if (["SHORT_ANSWER", "ESSAY", "FILL_IN_BLANK"].includes(question.type)) {
        if (!question.correctAnswer?.trim()) {
          return res.status(400).json({
            success: false,
            message: `Question ${
              i + 1
            }: Correct answer is required for ${question.type
              .toLowerCase()
              .replace("_", " ")} questions`,
          });
        }
      }

      if (question.type === "MATCHING") {
        if (
          !question.matchingPairs ||
          !Array.isArray(question.matchingPairs) ||
          question.matchingPairs.length < 2
        ) {
          return res.status(400).json({
            success: false,
            message: `Question ${
              i + 1
            }: Matching questions must have at least 2 matching pairs`,
          });
        }

        for (let j = 0; j < question.matchingPairs.length; j++) {
          const pair = question.matchingPairs[j];
          if (!pair.left?.trim() || !pair.right?.trim()) {
            return res.status(400).json({
              success: false,
              message: `Question ${i + 1}, Pair ${
                j + 1
              }: Both left and right items are required`,
            });
          }
        }
      }

      if (question.type === "CODE_CHALLENGE") {
        if (!question.codeTemplate) {
          return res.status(400).json({
            success: false,
            message: `Question ${
              i + 1
            }: Code template is required for code challenge questions`,
          });
        }

        if (
          !question.testCases ||
          !Array.isArray(question.testCases) ||
          question.testCases.length === 0
        ) {
          return res.status(400).json({
            success: false,
            message: `Question ${
              i + 1
            }: At least one test case is required for code challenges`,
          });
        }
      }
    }

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true,
            status: true,
          },
        },
      },
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true, isVerified: true },
    });

    if (!instructor || instructor.id !== section.course.instructorId) {
      return res.status(403).json({
        success: false,
        message: "You can only create quizzes for your own courses",
      });
    }

    if (!instructor.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Only verified instructors can create quizzes",
      });
    }

    let quizOrder = order;
    if (quizOrder === undefined) {
      const lastQuiz = await prisma.quiz.findFirst({
        where: { sectionId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      quizOrder = lastQuiz ? lastQuiz.order + 1 : 1;
    }

    const existingQuiz = await prisma.quiz.findFirst({
      where: {
        sectionId,
        order: quizOrder,
      },
    });

    if (existingQuiz) {
      await prisma.quiz.updateMany({
        where: {
          sectionId,
          order: { gte: quizOrder },
        },
        data: {
          order: { increment: 1 },
        },
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const quiz = await tx.quiz.create({
        data: {
          title: title.trim(),
          description: description?.trim(),
          instructions: instructions?.trim(),
          duration: parseInt(duration),
          passingScore: parseInt(passingScore),
          maxAttempts: parseInt(maxAttempts),
          order: quizOrder,
          isRequired: isRequired === "true" || isRequired === true,
          randomizeQuestions:
            randomizeQuestions === "true" || randomizeQuestions === true,
          showResults: showResults === "true" || showResults === true,
          allowReview: allowReview === "true" || allowReview === true,
          sectionId,
        },
      });

      const createdQuestions = [];
      for (let i = 0; i < questions.length; i++) {
        const questionData = questions[i];

        const questionCreateData = {
          question: questionData.question.trim(),
          type: questionData.type,
          points: parseInt(questionData.points),
          order: i + 1,
          explanation: questionData.explanation?.trim(),
          hints: questionData.hints || [],
          difficulty: questionData.difficulty || "MEDIUM",
          tags: questionData.tags || [],
          quizId: quiz.id,
        };

        if (["MULTIPLE_CHOICE", "SINGLE_CHOICE"].includes(questionData.type)) {
          questionCreateData.options = questionData.options;
          questionCreateData.correctAnswer = Array.isArray(
            questionData.correctAnswer
          )
            ? questionData.correctAnswer
            : [questionData.correctAnswer];
        }

        if (questionData.type === "TRUE_FALSE") {
          questionCreateData.options = ["true", "false"];
          questionCreateData.correctAnswer = [
            questionData.correctAnswer.toLowerCase(),
          ];
        }

        if (
          ["SHORT_ANSWER", "ESSAY", "FILL_IN_BLANK"].includes(questionData.type)
        ) {
          questionCreateData.correctAnswer = [
            questionData.correctAnswer.trim(),
          ];
        }

        if (questionData.type === "MATCHING") {
          questionCreateData.matchingPairs = questionData.matchingPairs;
        }

        if (questionData.type === "CODE_CHALLENGE") {
          questionCreateData.codeTemplate = questionData.codeTemplate;
          questionCreateData.testCases = questionData.testCases;
          questionCreateData.language = questionData.language || "javascript";
        }

        const question = await tx.question.create({
          data: questionCreateData,
        });

        createdQuestions.push(question);
      }

      return { quiz, questions: createdQuestions };
    });

    await Promise.all([
      prisma.section.update({
        where: { id: sectionId },
        data: { updatedAt: new Date() },
      }),
      prisma.course.update({
        where: { id: section.course.id },
        data: {
          lastUpdated: new Date(),
        },
      }),
    ]);

    const createdQuiz = await prisma.quiz.findUnique({
      where: { id: result.quiz.id },
      include: {
        section: {
          select: {
            id: true,
            title: true,
            course: {
              select: {
                id: true,
                title: true,
                instructor: {
                  select: {
                    user: {
                      select: { firstName: true, lastName: true },
                    },
                  },
                },
              },
            },
          },
        },
        questions: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
    });

    await prisma.notification.create({
      data: {
        type: "QUIZ_CREATED",
        title: "Quiz Created",
        message: `Quiz "${title}" has been created successfully with ${questions.length} questions.`,
        userId: req.userAuthId,
        priority: "NORMAL",
        data: {
          quizId: createdQuiz.id,
          quizTitle: title,
          sectionId,
          courseId: section.course.id,
          courseTitle: section.course.title,
          questionsCount: questions.length,
          totalPoints: questions.reduce(
            (sum, q) => sum + parseInt(q.points),
            0
          ),
        },
      },
    });

    if (section.course.status === "PUBLISHED") {
      try {
        const enrolledStudents = await prisma.enrollment.findMany({
          where: {
            courseId: section.course.id,
            status: "ACTIVE",
          },
          include: {
            student: {
              include: {
                user: {
                  select: { id: true, firstName: true, email: true },
                },
              },
            },
          },
          take: 100,
        });

        const notificationPromises = enrolledStudents.map((enrollment) =>
          prisma.notification
            .create({
              data: {
                type: "NEW_QUIZ",
                title: "New Quiz Available",
                message: `A new quiz "${title}" has been added to your course "${section.course.title}".`,
                userId: enrollment.student.user.id,
                priority: "NORMAL",
                data: {
                  quizId: createdQuiz.id,
                  quizTitle: title,
                  courseId: section.course.id,
                  courseTitle: section.course.title,
                  sectionId,
                  duration: parseInt(duration),
                  passingScore: parseInt(passingScore),
                  maxAttempts: parseInt(maxAttempts),
                  questionsCount: questions.length,
                  isRequired: isRequired === "true" || isRequired === true,
                },
              },
            })
            .catch((error) => {
              educademyLogger.error(
                "Failed to create student notification",
                error,
                {
                  userId: enrollment.student.user.id,
                  quizId: createdQuiz.id,
                }
              );
            })
        );

        await Promise.allSettled(notificationPromises);
      } catch (notificationError) {
        educademyLogger.error(
          "Failed to send quiz notifications",
          notificationError,
          {
            userId: req.userAuthId,
            quizId: createdQuiz.id,
          }
        );
      }
    }

    educademyLogger.logBusinessOperation(
      "CREATE_QUIZ",
      "QUIZ",
      createdQuiz.id,
      "SUCCESS",
      {
        quizTitle: title,
        sectionId,
        courseId: section.course.id,
        questionsCount: questions.length,
        totalPoints: questions.reduce((sum, q) => sum + parseInt(q.points), 0),
        duration: parseInt(duration),
        passingScore: parseInt(passingScore),
        maxAttempts: parseInt(maxAttempts),
        order: quizOrder,
        instructorId: section.course.instructorId,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("CREATE_QUIZ", startTime, {
      userId: req.userAuthId,
      quizId: createdQuiz.id,
      sectionId,
      courseId: section.course.id,
      questionsCount: questions.length,
    });

    educademyLogger.logMethodExit(
      "QuizController",
      "createQuiz",
      true,
      performance.now() - startTime
    );

    const responseData = {
      quiz: {
        id: createdQuiz.id,
        title: createdQuiz.title,
        description: createdQuiz.description,
        instructions: createdQuiz.instructions,
        duration: createdQuiz.duration,
        passingScore: createdQuiz.passingScore,
        maxAttempts: createdQuiz.maxAttempts,
        order: createdQuiz.order,
        isRequired: createdQuiz.isRequired,
        randomizeQuestions: createdQuiz.randomizeQuestions,
        showResults: createdQuiz.showResults,
        allowReview: createdQuiz.allowReview,
        sectionId: createdQuiz.sectionId,
        section: createdQuiz.section,
        questions: createdQuiz.questions,
        stats: {
          totalQuestions: createdQuiz._count.questions,
          totalAttempts: createdQuiz._count.attempts,
          totalPoints: createdQuiz.questions.reduce(
            (sum, q) => sum + q.points,
            0
          ),
        },
        createdAt: createdQuiz.createdAt,
        updatedAt: createdQuiz.updatedAt,
      },
    };

    res.status(201).json({
      success: true,
      message: "Quiz created successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Create quiz failed", error, {
      userId: req.userAuthId,
      sectionId: req.params.sectionId,
      title: req.body.title,
      business: {
        operation: "CREATE_QUIZ",
        entity: "QUIZ",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "QuizController",
      "createQuiz",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to create quiz",
      requestId,
    });
  }
});

export const updateQuiz = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { quizId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "QuizController",
    methodName: "updateQuiz",
  });

  educademyLogger.logMethodEntry("QuizController", "updateQuiz", {
    userId: req.userAuthId,
    quizId,
  });

  try {
    const {
      title,
      description,
      instructions,
      duration,
      passingScore,
      maxAttempts,
      randomizeQuestions,
      showResults,
      allowReview,
      isRequired,
      order,
      questions,
    } = req.body;

    const currentQuiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        section: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                instructorId: true,
                status: true,
              },
            },
          },
        },
        questions: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
    });

    if (!currentQuiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (
      !instructor ||
      instructor.id !== currentQuiz.section.course.instructorId
    ) {
      educademyLogger.logSecurityEvent(
        "UNAUTHORIZED_QUIZ_UPDATE_ATTEMPT",
        "HIGH",
        {
          userId: req.userAuthId,
          quizId,
          actualOwnerId: currentQuiz.section.course.instructorId,
        },
        req.userAuthId
      );

      return res.status(403).json({
        success: false,
        message: "You can only update quizzes for your own courses",
      });
    }

    if (currentQuiz.section.course.status === "UNDER_REVIEW") {
      return res.status(400).json({
        success: false,
        message: "Cannot update quiz while course is under review",
      });
    }

    if (
      currentQuiz.section.course.status === "PUBLISHED" &&
      currentQuiz._count.attempts > 0
    ) {
      const restrictedFields = ["passingScore", "maxAttempts", "duration"];
      const hasRestrictedChanges = restrictedFields.some(
        (field) =>
          req.body[field] !== undefined &&
          req.body[field] !== currentQuiz[field]
      );

      if (hasRestrictedChanges) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot modify scoring settings for published quizzes with attempts",
          restrictedFields,
        });
      }

      if (questions !== undefined) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot modify questions for published quizzes with student attempts",
          suggestion: "Create a new quiz version instead",
        });
      }
    }

    if (questions !== undefined) {
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one question is required",
        });
      }

      const validQuestionTypes = [
        "MULTIPLE_CHOICE",
        "SINGLE_CHOICE",
        "TRUE_FALSE",
        "SHORT_ANSWER",
        "ESSAY",
        "FILL_IN_BLANK",
        "MATCHING",
        "DRAG_DROP",
        "CODE_CHALLENGE",
      ];

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];

        if (!question.question?.trim()) {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1}: Question text is required`,
          });
        }

        if (!question.type || !validQuestionTypes.includes(question.type)) {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1}: Invalid question type`,
          });
        }

        if (!question.points || question.points <= 0) {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1}: Points must be greater than 0`,
          });
        }
      }
    }

    const updateData = {};

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Title cannot be empty",
        });
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) updateData.description = description?.trim();
    if (instructions !== undefined)
      updateData.instructions = instructions?.trim();
    if (isRequired !== undefined)
      updateData.isRequired = isRequired === "true" || isRequired === true;
    if (randomizeQuestions !== undefined)
      updateData.randomizeQuestions =
        randomizeQuestions === "true" || randomizeQuestions === true;
    if (showResults !== undefined)
      updateData.showResults = showResults === "true" || showResults === true;
    if (allowReview !== undefined)
      updateData.allowReview = allowReview === "true" || allowReview === true;

    if (duration !== undefined) {
      const quizDuration = parseInt(duration);
      if (isNaN(quizDuration) || quizDuration <= 0) {
        return res.status(400).json({
          success: false,
          message: "Duration must be greater than 0",
        });
      }
      updateData.duration = quizDuration;
    }

    if (passingScore !== undefined) {
      const score = parseInt(passingScore);
      if (isNaN(score) || score < 0 || score > 100) {
        return res.status(400).json({
          success: false,
          message: "Passing score must be between 0 and 100",
        });
      }
      updateData.passingScore = score;
    }

    if (maxAttempts !== undefined) {
      const attempts = parseInt(maxAttempts);
      if (isNaN(attempts) || attempts < 1) {
        return res.status(400).json({
          success: false,
          message: "Max attempts must be at least 1",
        });
      }
      updateData.maxAttempts = attempts;
    }

    if (order !== undefined && order !== currentQuiz.order) {
      if (order < 0) {
        return res.status(400).json({
          success: false,
          message: "Order must be a non-negative number",
        });
      }

      const conflictingQuiz = await prisma.quiz.findFirst({
        where: {
          sectionId: currentQuiz.sectionId,
          order,
          id: { not: quizId },
        },
      });

      if (conflictingQuiz) {
        if (order > currentQuiz.order) {
          await prisma.quiz.updateMany({
            where: {
              sectionId: currentQuiz.sectionId,
              order: {
                gt: currentQuiz.order,
                lte: order,
              },
              id: { not: quizId },
            },
            data: {
              order: { decrement: 1 },
            },
          });
        } else {
          await prisma.quiz.updateMany({
            where: {
              sectionId: currentQuiz.sectionId,
              order: {
                gte: order,
                lt: currentQuiz.order,
              },
              id: { not: quizId },
            },
            data: {
              order: { increment: 1 },
            },
          });
        }
      }

      updateData.order = order;
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedQuiz = await tx.quiz.update({
        where: { id: quizId },
        data: updateData,
      });

      if (questions !== undefined) {
        await tx.question.deleteMany({
          where: { quizId },
        });

        const createdQuestions = [];
        for (let i = 0; i < questions.length; i++) {
          const questionData = questions[i];

          const questionCreateData = {
            question: questionData.question.trim(),
            type: questionData.type,
            points: parseInt(questionData.points),
            order: i + 1,
            explanation: questionData.explanation?.trim(),
            hints: questionData.hints || [],
            difficulty: questionData.difficulty || "MEDIUM",
            tags: questionData.tags || [],
            quizId: updatedQuiz.id,
          };

          if (
            ["MULTIPLE_CHOICE", "SINGLE_CHOICE"].includes(questionData.type)
          ) {
            questionCreateData.options = questionData.options;
            questionCreateData.correctAnswer = Array.isArray(
              questionData.correctAnswer
            )
              ? questionData.correctAnswer
              : [questionData.correctAnswer];
          }

          if (questionData.type === "TRUE_FALSE") {
            questionCreateData.options = ["true", "false"];
            questionCreateData.correctAnswer = [
              questionData.correctAnswer.toLowerCase(),
            ];
          }

          if (
            ["SHORT_ANSWER", "ESSAY", "FILL_IN_BLANK"].includes(
              questionData.type
            )
          ) {
            questionCreateData.correctAnswer = [
              questionData.correctAnswer.trim(),
            ];
          }

          if (questionData.type === "MATCHING") {
            questionCreateData.matchingPairs = questionData.matchingPairs;
          }

          if (questionData.type === "CODE_CHALLENGE") {
            questionCreateData.codeTemplate = questionData.codeTemplate;
            questionCreateData.testCases = questionData.testCases;
            questionCreateData.language = questionData.language || "javascript";
          }

          const question = await tx.question.create({
            data: questionCreateData,
          });

          createdQuestions.push(question);
        }

        return { quiz: updatedQuiz, questions: createdQuestions };
      }

      return { quiz: updatedQuiz, questions: null };
    });

    await prisma.course.update({
      where: { id: currentQuiz.section.courseId },
      data: {
        lastUpdated: new Date(),
      },
    });

    const finalQuiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        section: {
          select: {
            id: true,
            title: true,
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        questions: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
    });

    educademyLogger.logBusinessOperation(
      "UPDATE_QUIZ",
      "QUIZ",
      quizId,
      "SUCCESS",
      {
        quizTitle: finalQuiz.title,
        sectionId: currentQuiz.sectionId,
        courseId: currentQuiz.section.courseId,
        changedFields: Object.keys(updateData),
        questionsUpdated: questions !== undefined,
        questionsCount: finalQuiz._count.questions,
        hasAttempts: currentQuiz._count.attempts > 0,
      }
    );

    educademyLogger.logAuditTrail(
      "UPDATE_QUIZ",
      "QUIZ",
      quizId,
      {
        title: currentQuiz.title,
        duration: currentQuiz.duration,
        passingScore: currentQuiz.passingScore,
        maxAttempts: currentQuiz.maxAttempts,
        order: currentQuiz.order,
        questionsCount: currentQuiz._count.questions,
      },
      {
        ...updateData,
        questionsUpdated: questions !== undefined,
        newQuestionsCount: finalQuiz._count.questions,
      },
      req.userAuthId
    );

    educademyLogger.performance("UPDATE_QUIZ", startTime, {
      quizId,
      changedFields: Object.keys(updateData).length,
      questionsUpdated: questions !== undefined,
    });

    educademyLogger.logMethodExit(
      "QuizController",
      "updateQuiz",
      true,
      performance.now() - startTime
    );

    res.status(200).json({
      success: true,
      message: "Quiz updated successfully",
      data: {
        quiz: {
          id: finalQuiz.id,
          title: finalQuiz.title,
          description: finalQuiz.description,
          instructions: finalQuiz.instructions,
          duration: finalQuiz.duration,
          passingScore: finalQuiz.passingScore,
          maxAttempts: finalQuiz.maxAttempts,
          randomizeQuestions: finalQuiz.randomizeQuestions,
          showResults: finalQuiz.showResults,
          allowReview: finalQuiz.allowReview,
          isRequired: finalQuiz.isRequired,
          order: finalQuiz.order,
          section: finalQuiz.section,
          questions: finalQuiz.questions,
          stats: {
            totalQuestions: finalQuiz._count.questions,
            totalAttempts: finalQuiz._count.attempts,
            totalPoints: finalQuiz.questions.reduce(
              (sum, q) => sum + q.points,
              0
            ),
          },
          createdAt: finalQuiz.createdAt,
          updatedAt: finalQuiz.updatedAt,
        },
        changes: {
          fieldsUpdated: Object.keys(updateData),
          orderChanged: updateData.order !== undefined,
          questionsUpdated: questions !== undefined,
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Update quiz failed", error, {
      userId: req.userAuthId,
      quizId,
      business: {
        operation: "UPDATE_QUIZ",
        entity: "QUIZ",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "QuizController",
      "updateQuiz",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to update quiz",
      requestId,
    });
  }
});

export const deleteQuiz = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { quizId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "QuizController",
    methodName: "deleteQuiz",
  });

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        section: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                instructorId: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (!instructor || instructor.id !== quiz.section.course.instructorId) {
      educademyLogger.logSecurityEvent(
        "UNAUTHORIZED_QUIZ_DELETE_ATTEMPT",
        "HIGH",
        {
          userId: req.userAuthId,
          quizId,
          actualOwnerId: quiz.section.course.instructorId,
        },
        req.userAuthId
      );

      return res.status(403).json({
        success: false,
        message: "You can only delete quizzes from your own courses",
      });
    }

    if (quiz.section.course.status === "PUBLISHED") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete quizzes from published courses",
        suggestion:
          "Consider archiving the course first if you need to make structural changes",
      });
    }

    if (quiz._count.attempts > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete quiz with student attempts",
        data: {
          totalAttempts: quiz._count.attempts,
          totalQuestions: quiz._count.questions,
        },
        suggestion:
          "Archive the course instead of deleting quizzes with student activity",
      });
    }

    await prisma.quiz.delete({
      where: { id: quizId },
    });

    await prisma.quiz.updateMany({
      where: {
        sectionId: quiz.sectionId,
        order: { gt: quiz.order },
      },
      data: {
        order: { decrement: 1 },
      },
    });

    await prisma.course.update({
      where: { id: quiz.section.courseId },
      data: {
        lastUpdated: new Date(),
      },
    });

    educademyLogger.logBusinessOperation(
      "DELETE_QUIZ",
      "QUIZ",
      quizId,
      "SUCCESS",
      {
        quizTitle: quiz.title,
        sectionId: quiz.sectionId,
        courseId: quiz.section.courseId,
        order: quiz.order,
        questionsDeleted: quiz._count.questions,
      }
    );

    educademyLogger.logAuditTrail(
      "DELETE_QUIZ",
      "QUIZ",
      quizId,
      quiz,
      null,
      req.userAuthId
    );

    educademyLogger.performance("DELETE_QUIZ", startTime, {
      quizId,
      questionsDeleted: quiz._count.questions,
    });

    res.status(200).json({
      success: true,
      message: "Quiz deleted successfully",
      data: {
        deletedQuiz: {
          id: quiz.id,
          title: quiz.title,
          order: quiz.order,
          questionsDeleted: quiz._count.questions,
        },
        section: {
          id: quiz.sectionId,
          title: quiz.section.title,
        },
        course: {
          id: quiz.section.courseId,
          title: quiz.section.course.title,
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Delete quiz failed", error, {
      userId: req.userAuthId,
      quizId,
      business: {
        operation: "DELETE_QUIZ",
        entity: "QUIZ",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to delete quiz",
      requestId,
    });
  }
});

export const getQuizById = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { quizId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "QuizController",
    methodName: "getQuizById",
  });

  try {
    const { includeQuestions = "true", includeAttempts = "false" } = req.query;

    const includeOptions = {
      section: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              instructorId: true,
              status: true,
            },
          },
        },
      },
      _count: {
        select: {
          questions: true,
          attempts: true,
        },
      },
    };

    if (includeQuestions === "true") {
      includeOptions.questions = {
        orderBy: { order: "asc" },
        select: {
          id: true,
          question: true,
          type: true,
          points: true,
          order: true,
          options: true,
          correctAnswer: true,
          explanation: true,
          createdAt: true,
        },
      };
    }

    if (includeAttempts === "true") {
      includeOptions.attempts = {
        select: {
          id: true,
          score: true,
          passed: true,
          startedAt: true,
          completedAt: true,
          timeSpent: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { startedAt: "desc" },
        take: 20,
      };
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: includeOptions,
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (!instructor || instructor.id !== quiz.section.course.instructorId) {
      return res.status(403).json({
        success: false,
        message: "You can only view quizzes from your own courses",
      });
    }

    const formattedQuiz = {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      instructions: quiz.instructions,
      duration: quiz.duration,
      passingScore: quiz.passingScore,
      maxAttempts: quiz.maxAttempts,
      randomizeQuestions: quiz.randomizeQuestions,
      showResults: quiz.showResults,
      allowReview: quiz.allowReview,
      isRequired: quiz.isRequired,
      order: quiz.order,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
      section: {
        id: quiz.section.id,
        title: quiz.section.title,
        course: quiz.section.course,
      },
      stats: {
        totalQuestions: quiz._count.questions,
        totalAttempts: quiz._count.attempts,
        totalPoints:
          quiz.questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0,
      },
    };

    if (includeQuestions === "true") {
      formattedQuiz.questions = quiz.questions || [];
    }

    if (includeAttempts === "true") {
      formattedQuiz.recentAttempts = quiz.attempts || [];

      if (quiz.attempts && quiz.attempts.length > 0) {
        const passedAttempts = quiz.attempts.filter((a) => a.passed).length;
        const avgScore =
          quiz.attempts.reduce((sum, a) => sum + a.score, 0) /
          quiz.attempts.length;

        formattedQuiz.attemptStats = {
          passRate: ((passedAttempts / quiz.attempts.length) * 100).toFixed(1),
          averageScore: avgScore.toFixed(1),
          totalPassed: passedAttempts,
          totalFailed: quiz.attempts.length - passedAttempts,
        };
      }
    }

    educademyLogger.performance("GET_QUIZ_BY_ID", startTime, {
      quizId,
      includeQuestions: includeQuestions === "true",
      includeAttempts: includeAttempts === "true",
    });

    res.status(200).json({
      success: true,
      message: "Quiz retrieved successfully",
      data: {
        quiz: formattedQuiz,
      },
    });
  } catch (error) {
    educademyLogger.error("Get quiz by ID failed", error, {
      userId: req.userAuthId,
      quizId,
      business: {
        operation: "GET_QUIZ_BY_ID",
        entity: "QUIZ",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve quiz",
      requestId,
    });
  }
});

export const getQuizAnalytics = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { quizId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "QuizController",
    methodName: "getQuizAnalytics",
  });

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        section: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                instructorId: true,
                status: true,
              },
            },
          },
        },
        attempts: {
          select: {
            id: true,
            score: true,
            passed: true,
            startedAt: true,
            completedAt: true,
            timeSpent: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        questions: {
          select: {
            id: true,
            question: true,
            type: true,
            points: true,
            answers: {
              select: {
                id: true,
                isCorrect: true,
                attempt: {
                  select: {
                    id: true,
                    userId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (!instructor || instructor.id !== quiz.section.course.instructorId) {
      return res.status(403).json({
        success: false,
        message: "You can only view analytics for your own quizzes",
      });
    }

    const attempts = quiz.attempts || [];
    const questions = quiz.questions || [];

    const analytics = {
      overview: {
        totalAttempts: attempts.length,
        uniqueStudents: new Set(attempts.map((a) => a.user.id)).size,
        passedAttempts: attempts.filter((a) => a.passed).length,
        failedAttempts: attempts.filter((a) => !a.passed).length,
        passRate:
          attempts.length > 0
            ? (
                (attempts.filter((a) => a.passed).length / attempts.length) *
                100
              ).toFixed(1)
            : 0,
        averageScore:
          attempts.length > 0
            ? (
                attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
              ).toFixed(1)
            : 0,
        totalQuestions: questions.length,
        totalPoints: questions.reduce((sum, q) => sum + (q.points || 0), 0),
      },
      scoreDistribution: {
        "90-100": attempts.filter((a) => a.score >= 90).length,
        "80-89": attempts.filter((a) => a.score >= 80 && a.score < 90).length,
        "70-79": attempts.filter((a) => a.score >= 70 && a.score < 80).length,
        "60-69": attempts.filter((a) => a.score >= 60 && a.score < 70).length,
        "Below 60": attempts.filter((a) => a.score < 60).length,
      },
      timeAnalytics: {
        averageTimeSpent:
          attempts.length > 0
            ? Math.round(
                attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0) /
                  attempts.length
              )
            : 0,
        quickestCompletion:
          attempts.length > 0
            ? Math.min(...attempts.map((a) => a.timeSpent || 0))
            : 0,
        slowestCompletion:
          attempts.length > 0
            ? Math.max(...attempts.map((a) => a.timeSpent || 0))
            : 0,
      },
      questionAnalytics: questions.map((question) => {
        const questionAnswers = question.answers || [];
        const correctAnswers = questionAnswers.filter(
          (a) => a.isCorrect
        ).length;
        const totalAnswers = questionAnswers.length;

        return {
          questionId: question.id,
          question:
            question.question.length > 100
              ? question.question.substring(0, 100) + "..."
              : question.question,
          type: question.type,
          points: question.points,
          totalAnswers,
          correctAnswers,
          incorrectAnswers: totalAnswers - correctAnswers,
          accuracy:
            totalAnswers > 0
              ? ((correctAnswers / totalAnswers) * 100).toFixed(1)
              : 0,
          difficulty:
            totalAnswers > 0
              ? correctAnswers / totalAnswers >= 0.8
                ? "Easy"
                : correctAnswers / totalAnswers >= 0.6
                ? "Medium"
                : "Hard"
              : "No Data",
        };
      }),
      recentActivity: attempts
        .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
        .slice(0, 10)
        .map((attempt) => ({
          studentName: `${attempt.user.firstName} ${attempt.user.lastName}`,
          score: attempt.score,
          passed: attempt.passed,
          timeSpent: attempt.timeSpent,
          completedAt: attempt.completedAt,
        })),
      trends: {
        lastWeek: attempts.filter(
          (a) =>
            new Date(a.startedAt) >=
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        lastMonth: attempts.filter(
          (a) =>
            new Date(a.startedAt) >=
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length,
        last3Months: attempts.filter(
          (a) =>
            new Date(a.startedAt) >=
            new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        ).length,
      },
    };

    const topPerformers = attempts
      .filter((a) => a.passed)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((attempt) => ({
        studentName: `${attempt.user.firstName} ${attempt.user.lastName}`,
        score: attempt.score,
        timeSpent: attempt.timeSpent,
        completedAt: attempt.completedAt,
      }));

    const strugglingStudents = attempts
      .filter((a) => !a.passed)
      .reduce((acc, attempt) => {
        const studentId = attempt.user.id;
        if (!acc[studentId]) {
          acc[studentId] = {
            studentName: `${attempt.user.firstName} ${attempt.user.lastName}`,
            attempts: 0,
            bestScore: 0,
            avgScore: 0,
            scores: [],
          };
        }
        acc[studentId].attempts++;
        acc[studentId].scores.push(attempt.score);
        acc[studentId].bestScore = Math.max(
          acc[studentId].bestScore,
          attempt.score
        );
        return acc;
      }, {});

    Object.keys(strugglingStudents).forEach((studentId) => {
      const student = strugglingStudents[studentId];
      student.avgScore = (
        student.scores.reduce((sum, score) => sum + score, 0) /
        student.scores.length
      ).toFixed(1);
      delete student.scores;
    });

    analytics.topPerformers = topPerformers;
    analytics.strugglingStudents = Object.values(strugglingStudents).slice(
      0,
      5
    );

    educademyLogger.logBusinessOperation(
      "GET_QUIZ_ANALYTICS",
      "QUIZ",
      quizId,
      "SUCCESS",
      {
        quizTitle: quiz.title,
        totalAttempts: attempts.length,
        uniqueStudents: analytics.overview.uniqueStudents,
        passRate: analytics.overview.passRate,
      }
    );

    educademyLogger.performance("GET_QUIZ_ANALYTICS", startTime, {
      quizId,
      attemptsAnalyzed: attempts.length,
      questionsAnalyzed: questions.length,
    });

    res.status(200).json({
      success: true,
      message: "Quiz analytics retrieved successfully",
      data: {
        quiz: {
          id: quiz.id,
          title: quiz.title,
          section: {
            id: quiz.section.id,
            title: quiz.section.title,
            course: {
              id: quiz.section.course.id,
              title: quiz.section.course.title,
            },
          },
        },
        analytics,
        metadata: {
          generatedAt: new Date(),
          dataRange: {
            earliestAttempt:
              attempts.length > 0
                ? attempts.sort(
                    (a, b) => new Date(a.startedAt) - new Date(b.startedAt)
                  )[0].startedAt
                : null,
            latestAttempt:
              attempts.length > 0
                ? attempts.sort(
                    (a, b) => new Date(b.startedAt) - new Date(a.startedAt)
                  )[0].startedAt
                : null,
          },
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Get quiz analytics failed", error, {
      userId: req.userAuthId,
      quizId,
      business: {
        operation: "GET_QUIZ_ANALYTICS",
        entity: "QUIZ",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve quiz analytics",
      requestId,
    });
  }
});

export const reorderQuizzes = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { sectionId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "QuizController",
    methodName: "reorderQuizzes",
  });

  try {
    const { quizOrders } = req.body;

    if (!Array.isArray(quizOrders) || quizOrders.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Quiz orders array is required",
      });
    }

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        course: {
          select: {
            id: true,
            instructorId: true,
            status: true,
          },
        },
      },
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (!instructor || instructor.id !== section.course.instructorId) {
      return res.status(403).json({
        success: false,
        message: "You can only reorder quizzes for your own courses",
      });
    }

    if (section.course.status === "UNDER_REVIEW") {
      return res.status(400).json({
        success: false,
        message: "Cannot reorder quizzes while course is under review",
      });
    }

    const existingQuizzes = await prisma.quiz.findMany({
      where: { sectionId },
      select: { id: true, order: true, title: true },
      orderBy: { order: "asc" },
    });

    const quizIds = quizOrders.map((item) => item.id);
    const existingIds = existingQuizzes.map((quiz) => quiz.id);

    const missingIds = existingIds.filter((id) => !quizIds.includes(id));
    const extraIds = quizIds.filter((id) => !existingIds.includes(id));

    if (missingIds.length > 0 || extraIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Quiz IDs mismatch",
        data: {
          missingIds,
          extraIds,
          expected: existingIds,
          received: quizIds,
        },
      });
    }

    for (const orderItem of quizOrders) {
      if (typeof orderItem.order !== "number" || orderItem.order < 1) {
        return res.status(400).json({
          success: false,
          message: "Order must be a positive number starting from 1",
        });
      }
    }

    const updatePromises = quizOrders.map(({ id, order }) =>
      prisma.quiz.update({
        where: { id },
        data: { order },
      })
    );

    await Promise.all(updatePromises);

    await prisma.course.update({
      where: { id: section.courseId },
      data: {
        lastUpdated: new Date(),
      },
    });

    const updatedQuizzes = await prisma.quiz.findMany({
      where: { sectionId },
      select: {
        id: true,
        title: true,
        order: true,
        duration: true,
        passingScore: true,
        maxAttempts: true,
        isRequired: true,
      },
      orderBy: { order: "asc" },
    });

    educademyLogger.logBusinessOperation(
      "REORDER_QUIZZES",
      "QUIZ",
      sectionId,
      "SUCCESS",
      {
        sectionId,
        courseId: section.courseId,
        quizCount: quizOrders.length,
        newOrder: quizOrders,
      }
    );

    educademyLogger.logAuditTrail(
      "REORDER_QUIZZES",
      "SECTION",
      sectionId,
      { quizzes: existingQuizzes },
      { newOrder: quizOrders },
      req.userAuthId
    );

    educademyLogger.performance("REORDER_QUIZZES", startTime, {
      sectionId,
      quizCount: quizOrders.length,
    });

    res.status(200).json({
      success: true,
      message: "Quizzes reordered successfully",
      data: {
        section: {
          id: section.id,
          title: section.title,
        },
        quizzes: updatedQuizzes,
      },
    });
  } catch (error) {
    educademyLogger.error("Reorder quizzes failed", error, {
      userId: req.userAuthId,
      sectionId,
      business: {
        operation: "REORDER_QUIZZES",
        entity: "QUIZ",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to reorder quizzes",
      requestId,
    });
  }
});

export const bulkUpdateQuizzes = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { sectionId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "QuizController",
    methodName: "bulkUpdateQuizzes",
  });

  try {
    const { quizIds, updates } = req.body;

    if (!Array.isArray(quizIds) || quizIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Quiz IDs array is required",
      });
    }

    if (!updates || typeof updates !== "object") {
      return res.status(400).json({
        success: false,
        message: "Updates object is required",
      });
    }

    if (quizIds.length > 20) {
      return res.status(400).json({
        success: false,
        message: "Cannot update more than 20 quizzes at once",
      });
    }

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        course: {
          select: {
            id: true,
            instructorId: true,
            status: true,
            title: true,
          },
        },
      },
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (!instructor || instructor.id !== section.course.instructorId) {
      return res.status(403).json({
        success: false,
        message: "You can only update quizzes for your own courses",
      });
    }

    if (section.course.status === "UNDER_REVIEW") {
      return res.status(400).json({
        success: false,
        message: "Cannot update quizzes while course is under review",
      });
    }

    const validFields = [
      "isRequired",
      "showResults",
      "allowReview",
      "randomizeQuestions",
    ];
    const invalidFields = Object.keys(updates).filter(
      (field) => !validFields.includes(field)
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid fields: ${invalidFields.join(
          ", "
        )}. Valid fields: ${validFields.join(", ")}`,
      });
    }

    const quizzes = await prisma.quiz.findMany({
      where: {
        id: { in: quizIds },
        sectionId,
      },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });

    if (quizzes.length !== quizIds.length) {
      const foundIds = quizzes.map((q) => q.id);
      const missingIds = quizIds.filter((id) => !foundIds.includes(id));

      return res.status(400).json({
        success: false,
        message: "Some quizzes not found in the specified section",
        data: { missingIds },
      });
    }

    if (section.course.status === "PUBLISHED") {
      const quizzesWithAttempts = quizzes.filter((q) => q._count.attempts > 0);
      if (quizzesWithAttempts.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot bulk update published quizzes with student attempts",
          data: {
            quizzesWithAttempts: quizzesWithAttempts.map((q) => ({
              id: q.id,
              title: q.title,
              attempts: q._count.attempts,
            })),
          },
        });
      }
    }

    const updateData = { ...updates };

    Object.keys(updateData).forEach((key) => {
      if (typeof updateData[key] === "string") {
        updateData[key] = updateData[key] === "true";
      }
    });

    await prisma.quiz.updateMany({
      where: {
        id: { in: quizIds },
        sectionId,
      },
      data: updateData,
    });

    await prisma.course.update({
      where: { id: section.courseId },
      data: {
        lastUpdated: new Date(),
      },
    });

    const updatedQuizzes = await prisma.quiz.findMany({
      where: {
        id: { in: quizIds },
      },
      select: {
        id: true,
        title: true,
        isRequired: true,
        showResults: true,
        allowReview: true,
        randomizeQuestions: true,
        order: true,
      },
      orderBy: { order: "asc" },
    });

    educademyLogger.logBusinessOperation(
      "BULK_UPDATE_QUIZZES",
      "QUIZ",
      sectionId,
      "SUCCESS",
      {
        sectionId,
        courseId: section.courseId,
        quizCount: quizIds.length,
        updatedFields: Object.keys(updates),
        updates,
      }
    );

    educademyLogger.logAuditTrail(
      "BULK_UPDATE_QUIZZES",
      "SECTION",
      sectionId,
      { quizIds },
      { updates, quizCount: quizIds.length },
      req.userAuthId
    );

    educademyLogger.performance("BULK_UPDATE_QUIZZES", startTime, {
      sectionId,
      quizCount: quizIds.length,
      updateFields: Object.keys(updates).length,
    });

    res.status(200).json({
      success: true,
      message: `${quizIds.length} quizzes updated successfully`,
      data: {
        section: {
          id: section.id,
          title: section.title,
          course: {
            id: section.course.id,
            title: section.course.title,
          },
        },
        updatedQuizzes,
        summary: {
          totalUpdated: quizIds.length,
          updatedFields: Object.keys(updates),
          changes: updates,
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Bulk update quizzes failed", error, {
      userId: req.userAuthId,
      sectionId,
      business: {
        operation: "BULK_UPDATE_QUIZZES",
        entity: "QUIZ",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to update quizzes",
      requestId,
    });
  }
});
