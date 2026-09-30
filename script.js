/*--Expense Tracker--*/


/*--Storage--*/

const KEY = "expense-tracker-data";

let transactions =
    JSON.parse(localStorage.getItem(KEY)) || [];

let editingId = null;


/* =========================================
   HELPER
========================================= */

const $ = (id) =>
    document.getElementById(id);

const form =
    $("transaction-form");


/*--Local Storage--*/

const save = () => {

    localStorage.setItem(
        KEY,
        JSON.stringify(transactions)
    );

};

/*--Currency Format--*/

const inr = (n) =>
    "₹" +
    n.toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

/* =========================================
   SECURITY
   Prevent HTML entered in description
   from being interpreted as HTML.
========================================= */

const escapeHTML = (s) =>
    s.replace(
        /[&<>"']/g,
        (c) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[c])
    );


/*--Category Filter--*/

[
    ...$("category").options
].forEach((o) => {

    $("filter-category").add(
        new Option(
            o.text,
            o.value
        )
    );

});

/*--Default Date--*/

$("date").valueAsDate =
    new Date();


/*--Main Render Function--*/

function render() {


    /*--Calculate Summary--*/

    const income =
        transactions
            .filter(
                t => t.type === "income"
            )
            .reduce(
                (sum, t) =>
                    sum + t.amount,
                0
            );

    const expense =
        transactions
            .filter(
                t => t.type === "expense"
            )
            .reduce(
                (sum, t) =>
                    sum + t.amount,
                0
            );

    /*--Display Summary--*/

    $("income-total").textContent =
        inr(income);

    $("expenses-total").textContent =
        inr(expense);

    $("balance-total").textContent =
        inr(income - expense);


    /*--Filter Transaction--*/

    const filterType =
        $("filter-type").value;

    const filterCategory =
        $("filter-category").value;


    const list =
        transactions
            .filter(
                t =>
                    (
                        filterType === "all" ||
                        t.type === filterType
                    )
                    &&
                    (
                        filterCategory === "all" ||
                        t.category === filterCategory
                    )
            )
            .sort(
                (a, b) =>
                    b.date.localeCompare(a.date)
            );


    /*--Display Transaction--*/

    $("transaction-list").innerHTML =

        list.map(
            t => `

                <tr>

                    <td>
                        ${t.date}
                    </td>

                    <td>
                        ${escapeHTML(t.description)}
                    </td>

                    <td>
                        ${t.category}
                    </td>

                    <td>
                        ${t.type}
                    </td>

                    <td class="${
                        t.type === "income"
                            ? "income-amount"
                            : "expense-amount"
                    }">

                        ${
                            t.type === "income"
                                ? "+"
                                : "-"
                        }${inr(t.amount)}

                    </td>

                    <td>

                        <button
                            data-action="edit"
                            data-id="${t.id}"
                        >
                            Edit
                        </button>

                        <button
                            data-action="delete"
                            data-id="${t.id}"
                        >
                            Delete
                        </button>

                    </td>

                </tr>

            `
        ).join("");


    /*--Empty Message--*/

    $("empty-message").hidden =
        list.length > 0;


    /*--Update Chart--*/

    drawExpenseChart();

}


/*--Reset Form--*/

function resetForm() {

    form.reset();

    $("date").valueAsDate =
        new Date();

    editingId = null;

    $("form-title").textContent =
        "Add Transaction";

    $("submit-btn").textContent =
        "Add Transaction";

    $("cancel-btn").hidden =
        true;

    $("form-error").textContent =
        "";

}

/*--Add/Update Transaction--*/

form.addEventListener(
    "submit",
    (e) => {

        e.preventDefault();


        const amount =
            parseFloat(
                $("amount").value
            );


        const description =
            $("description")
                .value
                .trim();


        const date =
            $("date").value;


        /*--Validation-- */

        if (
            !amount ||
            amount <= 0
        ) {

            $("form-error").textContent =
                "Enter an amount greater than 0.";

            return;

        }

        if (!description) {

            $("form-error").textContent =
                "Description cannot be empty.";

            return;

        }

        if (!date) {

            $("form-error").textContent =
                "Please select a date.";

            return;

        }

        /*--Create Transaction Data-- */

        const data = {

            type:
                $("type").value,

            amount:
                amount,

            category:
                $("category").value,

            date:
                date,

            description:
                description

        };

        /*--Update Existing Transaction--*/

        if (editingId) {

            transactions =
                transactions.map(
                    t =>
                        t.id === editingId
                            ? {
                                ...t,
                                ...data
                            }
                            : t
                );

        }

        /*--Add New Transaction--*/

        else {

            transactions.push({

                id:
                    Date.now().toString(),

                ...data

            });

        }

        /*--Save+Update UI--*/

        save();
        render();
        resetForm();

    }
);

/*--Edit+Delete--*/

$("transaction-list")
    .addEventListener(
        "click",
        (e) => {

            const btn =
                e.target.closest("button");

            if (!btn)
                return;

            const id =
                btn.dataset.id;

            /*--Delete--*/

            if (
                btn.dataset.action ===
                "delete"
            ) {

                if (
                    confirm(
                        "Delete this transaction?"
                    )
                ) {

                    transactions =
                        transactions.filter(
                            t =>
                                t.id !== id
                        );

                    save();
                    render();

                }

            }

            /*--Edit--*/

            else if (
                btn.dataset.action ===
                "edit"
            ) {

                const transaction =
                    transactions.find(
                        t =>
                            t.id === id
                    );

                if (!transaction)
                    return;

                $("type").value =
                    transaction.type;

                $("amount").value =
                    transaction.amount;

                $("category").value =
                    transaction.category;

                $("date").value =
                    transaction.date;

                $("description").value =
                    transaction.description;

                editingId = id;

                $("form-title").textContent =
                    "Edit Transaction";

                $("submit-btn").textContent =
                    "Update Transaction";

                $("cancel-btn").hidden =
                    false;

                form.scrollIntoView({
                    behavior: "smooth"
                });

            }

        }
    );

/*--Cancel Edit--*/

$("cancel-btn")
    .addEventListener(
        "click",
        resetForm
    );

/*--Filter--*/

$("filter-type")
    .addEventListener(
        "change",
        render
    );

$("filter-category")
    .addEventListener(
        "change",
        render
    );

/*--Expense Chart--*/

function drawExpenseChart() {
    const canvas =
        $("expense-chart");

    const ctx =
        canvas.getContext("2d");

    /*--Clear Previous Chart--*/

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    /*--Group Expenses by Category-- */

    const categoryTotals = {};

    transactions
        .filter(
            t =>
                t.type === "expense"
        )
        .forEach(
            t => {

                if (
                    !categoryTotals[
                        t.category
                    ]
                ) {

                    categoryTotals[
                        t.category
                    ] = 0;

                }

                categoryTotals[
                    t.category
                ] += t.amount;

            }
        );

    const entries =
        Object.entries(
            categoryTotals
        );

    /*--No Expenses--*/

    if (entries.length === 0) {

        drawEmptyChart(
            ctx,
            canvas
        );

        $("chart-legend").innerHTML = `
            <p style="
                text-align:center;
                color:#7A7785;
                font-size:0.78rem;
            ">
                Add an expense to see your
                spending breakdown.
            </p>
        `;

        return;

    }

    /* -------------------------------------
       SORT CATEGORIES
       Highest expense first
    ------------------------------------- */

    entries.sort(
        (a, b) =>
            b[1] - a[1]
    );


    /*--Colors--*/

    const colors = [

        "#3D315B",
        "#7BAE8A",
        "#D98282",
        "#9B8FB8",
        "#C5A880",
        "#6F9EAA",
        "#B87979"

    ];

    /*--Expense Tracker--*/

    const total =
        entries.reduce(
            (sum, item) =>
                sum + item[1],
            0
        );

    /*--Chart Settings--*/

    const centerX =
        canvas.width / 2;

    const centerY =
        canvas.height / 2;

    const radius =
        95;

    const lineWidth =
        30;

    let startAngle =
        -Math.PI / 2;

    /*--Donut Chart--*/

    entries.forEach(
        (entry, index) => {

            const value =
                entry[1];

            const sliceAngle =
                (
                    value / total
                ) *
                Math.PI *
                2;

            const endAngle =
                startAngle +
                sliceAngle;

            ctx.beginPath();

            ctx.arc(
                centerX,
                centerY,
                radius,
                startAngle,
                endAngle
            );

            ctx.strokeStyle =
                colors[
                    index %
                    colors.length
                ];

            ctx.lineWidth =
                lineWidth;

            ctx.lineCap =
                "butt";

            ctx.stroke();

            startAngle =
                endAngle;

        }
    );

    /*--White Center--*/

    ctx.beginPath();

    ctx.arc(
        centerX,
        centerY,
        radius - lineWidth / 2 - 2,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#FFFFFF";

    ctx.fill();

    /*--Center Text-- */

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillStyle =
        "#292733";

    ctx.font =
        "bold 17px Arial";

    ctx.fillText(
        inr(total),
        centerX,
        centerY - 7
    );

    ctx.fillStyle =
        "#7A7785";

    ctx.font =
        "11px Arial";

    ctx.fillText(
        "Total spent",
        centerX,
        centerY + 14
    );

    /*--Create Legend--*/

    $("chart-legend").innerHTML =

        entries
            .map(
                (entry, index) => {

                    const category =
                        entry[0];

                    const amount =
                        entry[1];

                    const percentage =
                        (
                            amount /
                            total
                        ) *
                        100;

                    return `
                        <div class="legend-item">
                            <div class="legend-name">
                                <span
                                    class="legend-dot"
                                    style="
                                        background:${
                                            colors[
                                                index %
                                                colors.length
                                            ]
                                        };
                                    "
                                ></span>
                                <span>
                                    ${category}
                                </span>
                            </div>
                            <span class="legend-amount">

                                ${inr(amount)}
                                (${percentage.toFixed(1)}%)

                            </span>
                        </div>
                    `;

                }
            )
            .join("");

}

/*--Empty Chart--*/

function drawEmptyChart(
    ctx,
    canvas
) {

    const centerX =
        canvas.width / 2;

    const centerY =
        canvas.height / 2;


    /*--Outer Ring--*/

    ctx.beginPath();

    ctx.arc(
        centerX,
        centerY,
        95,
        0,
        Math.PI * 2
    );

    ctx.strokeStyle =
        "#E8E5E1";

    ctx.lineWidth =
        30;

    ctx.stroke();

    /*--Center--*/

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillStyle =
        "#7A7785";

    ctx.font =
        "12px Arial";

    ctx.fillText(
        "No expenses",
        centerX,
        centerY
    );

}

/*--Initial Display--*/

render();