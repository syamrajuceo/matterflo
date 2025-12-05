-- CreateTable
CREATE TABLE "client_task_completions" (
    "userId" TEXT NOT NULL,
    "clientTaskId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_task_completions_pkey" PRIMARY KEY ("userId","clientTaskId")
);

-- AddForeignKey
ALTER TABLE "client_task_completions" ADD CONSTRAINT "client_task_completions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
