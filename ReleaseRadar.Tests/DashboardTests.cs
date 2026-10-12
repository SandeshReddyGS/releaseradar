using Microsoft.Playwright.NUnit;
using Microsoft.Playwright;
using NUnit.Framework;
using System;
using System.Threading.Tasks;

namespace ReleaseRadar.Tests;

[Parallelizable(ParallelScope.Self)]
[TestFixture]
public class DashboardTests : PageTest
{
    // =========================================================================
    // TRACE RECORDING SETUP
    // =========================================================================
    
    [SetUp]
    public async Task StartTracing()
    {
        // Starts recording the DOM, network, and screenshots before each test begins
        await Context.Tracing.StartAsync(new()
        {
            Screenshots = true,
            Snapshots = true,
            Sources = true
        });
    }

    [TearDown]
    public async Task StopTracing()
    {
        // 1. Check if the currently running test failed
        bool testFailed = TestContext.CurrentContext.Result.Outcome.Status == NUnit.Framework.Interfaces.TestStatus.Failed;

        if (testFailed)
        {
            // Stop recording and save the file only because it failed
            await Context.Tracing.StopAsync(new()
            {
                Path = $"trace_failed_{TestContext.CurrentContext.Test.Name}.zip"
            });
        }
        else
        {
            // If the test passed, stop recording but discard the trace data to save space
            await Context.Tracing.StopAsync();
        }

        /* 
        // =====================================================================
        // UNCOMMENT THIS BLOCK AND DELETE THE IF/ELSE ABOVE 
        // TO ALWAYS SAVE TRACES FOR EVERY TEST (PASS OR FAIL)
        // =====================================================================
        //
        // await Context.Tracing.StopAsync(new()
        // {
        //     Path = $"trace_{TestContext.CurrentContext.Test.Name}.zip"
        // });
        */
    }

    // =========================================================================
    // HELPER METHOD
    // =========================================================================
    
    private async Task LoginAsAdminAsync()
    {
        await Page.GotoAsync("http://localhost:5173/login");
        await Page.FillAsync("input[type='email']", "admin@company.com");
        await Page.FillAsync("input[type='password']", "admin123");
        await Page.ClickAsync("button[type='submit']");
        
        // Wait for the specific heading rendered by your Dashboard.jsx component
        await Expect(Page.Locator("h2")).ToHaveTextAsync("ReleaseRadar Live Dashboard", new() { Timeout = 15000 });
    }

    // =========================================================================
    // TEST CASES
    // =========================================================================

    [Test]
    public async Task UserCanRegisterSuccessfully()
    {
        string uniqueEmail = $"newuser_{Guid.NewGuid().ToString()[..8]}@company.com";
        await Page.GotoAsync("http://localhost:5173/register");

        await Page.FillAsync("input[type='email']", uniqueEmail);
        await Page.FillAsync("input[type='password']", "password123");
        
        var roleDropdown = Page.Locator("select");
        if (await roleDropdown.IsVisibleAsync())
        {
            await roleDropdown.SelectOptionAsync(new[] { "Admin" });
        }

        await Page.ClickAsync("button[type='submit']");

        await Expect(Page.Locator("h2")).ToHaveTextAsync("ReleaseRadar Login", new() { Timeout = 15000 });
    }

    [Test]
    public async Task UserCanLogInSuccessfully()
    {
        await Page.GotoAsync("http://localhost:5173/login");
        await Page.FillAsync("input[type='email']", "admin@company.com");
        await Page.FillAsync("input[type='password']", "admin123");
        await Page.ClickAsync("button[type='submit']");

        // Verify the dashboard header and role text
        await Expect(Page.Locator("h2")).ToHaveTextAsync("ReleaseRadar Live Dashboard");
        
        // Loosen the role text assertion to ensure it matches the paragraph content safely
        await Expect(Page.Locator("body")).ToContainTextAsync("Logged in as: Admin");
    }

    [Test]
    public async Task AdminCanAddProject()
    {
        await LoginAsAdminAsync();

        // Listen for the 4 consecutive window.prompt() calls triggered by handleAddProject
        Page.Dialog += async (_, dialog) =>
        {
            if (dialog.Type == DialogType.Prompt)
            {
                if (dialog.Message == "Enter project name:")
                    await dialog.AcceptAsync("Automated Playwright Project");
                else if (dialog.Message == "Enter team name:")
                    await dialog.AcceptAsync("QA Automation");
                else if (dialog.Message == "Enter last deploy date (YYYY-MM-DD):")
                    await dialog.AcceptAsync("2026-10-12");
                else if (dialog.Message == "Enter deployment message:")
                    await dialog.AcceptAsync("Initial automated commit");
                else
                    await dialog.AcceptAsync("");
            }
        };

        // Trigger the prompts using the exact class from your Dashboard.jsx
        await Page.ClickAsync("button.btn-add");

        // Verify the newly created project appears in the table
        var table = Page.Locator("table.projects-table");
        await Expect(table).ToContainTextAsync("Automated Playwright Project");
        await Expect(table).ToContainTextAsync("QA Automation");
    }

    [Test]
    public async Task AdminCanEditProject()
    {
        await LoginAsAdminAsync();

        // Listen for the window.prompt() calls triggered by handleEdit
        Page.Dialog += async (_, dialog) =>
        {
            if (dialog.Type == DialogType.Prompt)
            {
                if (dialog.Message.Contains("Edit project name:"))
                    await dialog.AcceptAsync("Updated E2E Project");
                else if (dialog.Message.Contains("Edit team name:"))
                    await dialog.AcceptAsync("Security Team");
                else if (dialog.Message.Contains("Edit last deploy date"))
                    await dialog.AcceptAsync("2026-11-01");
                else if (dialog.Message.Contains("Edit deployment message:"))
                    await dialog.AcceptAsync("Hotfix deployed");
                else
                    await dialog.AcceptAsync(dialog.DefaultValue); 
            }
        };

        // Click the first Edit button found in the table using the class from Dashboard.jsx
        await Page.Locator("button.btn-edit").First.ClickAsync();

        // Verify the table row updated with the new text
        var table = Page.Locator("table.projects-table");
        await Expect(table).ToContainTextAsync("Updated E2E Project");
        await Expect(table).ToContainTextAsync("Security Team");
    }

    [Test]
    public async Task AdminCanDeleteProject()
    {
        await LoginAsAdminAsync();

        // Listen for the window.confirm() call triggered by handleDelete
        Page.Dialog += async (_, dialog) => 
        {
            if (dialog.Type == DialogType.Confirm && dialog.Message == "Are you sure you want to delete this project?")
            {
                await dialog.AcceptAsync();
            }
        };

        var tableRows = Page.Locator("tbody tr");

        // Wait for the API fetch to complete and render at least one row
        await tableRows.First.WaitForAsync(new() { Timeout = 5000 });

        int initialCount = await tableRows.CountAsync();

        Assert.That(initialCount, Is.GreaterThan(0), "No projects available to delete. Seed your database.");

        // Click the first Delete button found using the specific class
        await Page.Locator("button.btn-delete").First.ClickAsync();

        // Verify the row count decreased by exactly one
        await Expect(tableRows).ToHaveCountAsync(initialCount - 1);
    }
}