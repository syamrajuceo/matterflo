import PDFDocument from 'pdfkit';
import { prisma } from '../../common/config/database.config';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

class PdfService {
  private readonly PDF_DIR = path.join(process.cwd(), 'uploads', 'pdfs');

  constructor() {
    // Ensure PDF directory exists
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await mkdir(this.PDF_DIR, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  /**
   * Generate PDF from task execution
   */
  async generateTaskPdf(
    taskExecutionId: string,
    options?: {
      includeData?: boolean;
      variables?: Record<string, any>;
    }
  ): Promise<{ filePath: string; filename: string }> {
    const taskExecution = await prisma.taskExecution.findUnique({
      where: { id: taskExecutionId },
      include: {
        task: true,
        executor: true,
      },
    });

    if (!taskExecution) {
      throw new Error(`Task execution with ID ${taskExecutionId} not found`);
    }

    const filename = `task-${taskExecution.task.name}-${Date.now()}.pdf`;
    const filePath = path.join(this.PDF_DIR, filename);

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text(taskExecution.task.name, { align: 'center' });
    doc.moveDown();

    // Task info
    doc.fontSize(14).text('Task Information', { underline: true });
    doc.fontSize(12);
    doc.text(`Status: ${taskExecution.status}`);
    doc.text(`Assigned To: ${taskExecution.executor?.email || 'N/A'}`);
    doc.text(`Created: ${new Date(taskExecution.createdAt).toLocaleString()}`);
    if (taskExecution.completedAt) {
      doc.text(`Completed: ${new Date(taskExecution.completedAt).toLocaleString()}`);
    }
    doc.moveDown();

    // Task description
    if (taskExecution.task.description) {
      doc.fontSize(14).text('Description', { underline: true });
      doc.fontSize(12).text(taskExecution.task.description);
      doc.moveDown();
    }

    // Form data if included
    if (options?.includeData && taskExecution.data) {
      doc.fontSize(14).text('Form Data', { underline: true });
      doc.fontSize(12);
      this.addFormDataToPdf(doc, taskExecution.data as Record<string, any>);
      doc.moveDown();
    }

    // Footer
    doc.fontSize(10).text(
      `Generated on ${new Date().toLocaleString()}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );

    doc.end();

    await new Promise<void>((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    return { filePath, filename };
  }

  /**
   * Generate PDF from flow instance
   */
  async generateFlowPdf(
    flowInstanceId: string,
    options?: {
      includeData?: boolean;
      variables?: Record<string, any>;
    }
  ): Promise<{ filePath: string; filename: string }> {
    const flowInstance = await prisma.flowInstance.findUnique({
      where: { id: flowInstanceId },
      include: {
        flow: {
          include: {
            levels: {
              orderBy: { order: 'asc' },
            },
          },
        },
        initiator: true,
        taskExecutions: {
          include: {
            task: true,
            executor: true,
          },
        },
      },
    });

    if (!flowInstance) {
      throw new Error(`Flow instance with ID ${flowInstanceId} not found`);
    }

    const filename = `flow-${flowInstance.flow.name}-${Date.now()}.pdf`;
    const filePath = path.join(this.PDF_DIR, filename);

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text(flowInstance.flow.name, { align: 'center' });
    doc.moveDown();

    // Flow info
    doc.fontSize(14).text('Flow Information', { underline: true });
    doc.fontSize(12);
    doc.text(`Status: ${flowInstance.status}`);
    doc.text(`Initiator: ${flowInstance.initiator?.email || 'N/A'}`);
    doc.text(`Started: ${new Date(flowInstance.startedAt).toLocaleString()}`);
    if (flowInstance.completedAt) {
      doc.text(`Completed: ${new Date(flowInstance.completedAt).toLocaleString()}`);
    }
    doc.moveDown();

    // Flow description
    if (flowInstance.flow.description) {
      doc.fontSize(14).text('Description', { underline: true });
      doc.fontSize(12).text(flowInstance.flow.description);
      doc.moveDown();
    }

    // Flow progress
    doc.fontSize(14).text('Progress', { underline: true });
    doc.fontSize(12);
    flowInstance.flow.levels.forEach((level, index) => {
      const levelExecutions = flowInstance.taskExecutions.filter(
        (te) => te.levelId === level.id
      );
      const isCompleted = levelExecutions.every((te) => te.status === 'COMPLETED');
      const isCurrent = flowInstance.currentLevelOrder === level.order;

      let status = 'Pending';
      if (isCompleted) status = 'Completed';
      else if (isCurrent) status = 'Current';

      doc.text(`Level ${level.order}: ${level.name} - ${status}`);
    });
    doc.moveDown();

    // Task executions if included
    if (options?.includeData && flowInstance.taskExecutions.length > 0) {
      doc.fontSize(14).text('Task Executions', { underline: true });
      doc.fontSize(12);
      flowInstance.taskExecutions.forEach((execution, index) => {
        doc.text(`\nTask ${index + 1}: ${execution.task.name}`);
        doc.text(`  Status: ${execution.status}`);
        doc.text(`  Executor: ${execution.executor?.email || 'N/A'}`);
        if (execution.data) {
          doc.text('  Data:');
          this.addFormDataToPdf(doc, execution.data as Record<string, any>, 20);
        }
      });
    }

    // Footer
    doc.fontSize(10).text(
      `Generated on ${new Date().toLocaleString()}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );

    doc.end();

    await new Promise<void>((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    return { filePath, filename };
  }

  /**
   * Generate PDF from custom template
   */
  async generateCustomPdf(
    template: string,
    data: Record<string, any>,
    filename?: string
  ): Promise<{ filePath: string; filename: string }> {
    const outputFilename = filename || `document-${Date.now()}.pdf`;
    const filePath = path.join(this.PDF_DIR, outputFilename);

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Simple template rendering
    // Replace {{variable}} with actual values
    let renderedTemplate = template;
    Object.keys(data).forEach((key) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      renderedTemplate = renderedTemplate.replace(regex, String(data[key]));
    });

    // Split by lines and add to PDF
    const lines = renderedTemplate.split('\n');
    lines.forEach((line) => {
      if (line.trim().startsWith('# ')) {
        doc.fontSize(20).text(line.replace('# ', ''), { align: 'center' });
        doc.moveDown();
      } else if (line.trim().startsWith('## ')) {
        doc.fontSize(16).text(line.replace('## ', ''), { underline: true });
        doc.moveDown();
      } else if (line.trim().startsWith('### ')) {
        doc.fontSize(14).text(line.replace('### ', ''), { underline: true });
        doc.moveDown();
      } else {
        doc.fontSize(12).text(line);
      }
    });

    // Footer
    doc.fontSize(10).text(
      `Generated on ${new Date().toLocaleString()}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );

    doc.end();

    await new Promise<void>((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    return { filePath, filename: outputFilename };
  }

  /**
   * Add form data to PDF document
   */
  private addFormDataToPdf(
    doc: InstanceType<typeof PDFDocument>,
    data: Record<string, any>,
    indent: number = 0
  ): void {
    Object.keys(data).forEach((key) => {
      const value = data[key];
      const indentStr = ' '.repeat(indent);
      if (typeof value === 'object' && value !== null) {
        doc.text(`${indentStr}${key}:`);
        this.addFormDataToPdf(doc, value, indent + 2);
      } else {
        doc.text(`${indentStr}${key}: ${String(value)}`);
      }
    });
  }

  /**
   * Delete PDF file
   */
  async deletePdf(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      // File might not exist, ignore
    }
  }
}

export const pdfService = new PdfService();

