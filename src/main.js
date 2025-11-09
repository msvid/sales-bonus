/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    const {discount, sale_price, quantity} = purchase;
    const discountMultiplier =   1 - (purchase.discount / 100);
    return sale_price*quantity*discountMultiplier
   // @TODO: Расчет выручки от операции
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    const {profit} = seller;
    if (index===0) {
        return seller.profit * 0.15;
    } else if (index===1 || index===2) {
        return seller.profit * 0.1;
    } else if (index === total-1) {
        return 0;
    } else {
        return seller.profit * 0.05;
    }
    // @TODO: Расчет бонуса от позиции в рейтинге
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (!data ||
        !Array.isArray(data.sellers)
        || data.sellers.length === 0 ||
        !Array.isArray(data.products)
        || data.products.length === 0 ||
        !Array.isArray(data.purchase_records)
        || data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }

    const calculateSimpleRevenue = options.calculateRevenue;
    const calculateBonusByProfit = options.calculateBonus
    // @TODO: Проверка наличия опций
    
    if (typeof options !== "object" ||
        typeof calculateSimpleRevenue !== "function" ||
        typeof calculateBonusByProfit !== "function"
    ) {
        throw new Error('Чего-то не хватает');
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики

    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex  = Object.fromEntries(sellerStats.map(item => [item.id, item]));
    const productIndex  = Object.fromEntries(data.products.map(item => [item.sku, item]));
    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => { // Чек 
        const seller = sellerIndex[record.seller_id]; // Продавец
        if (seller) {
            seller.sales_count += 1; // Увеличить количество продаж
            seller.revenue += record.total_amount; // Увеличить общую сумму всех продаж
        }
          
        // Расчёт прибыли для каждого товара
        record.items.forEach(item => {
            const product = productIndex[item.sku]; // Товар
            if(product) {
                const cost = product.purchase_price * item.quantity; // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
                const revenue = calculateSimpleRevenue(item, product); // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
                const profit = revenue - cost; // Посчитать прибыль: выручка минус себестоимость
                seller.profit += profit; // Увеличить общую накопленную прибыль (profit) у продавца  
            }
    
            // Учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;// По артикулу товара увеличить его проданное количество у продавца
        });
    });
    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a,b) => b.profit - a.profit); 
    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonusByProfit(index, sellerStats.length, seller);// Считаем бонус
        seller.top_products = Object.entries(seller.products_sold || {})
                                .sort(([, quantityA], [, quantityB]) => quantityB - quantityA)
                                .slice(0, 10)
                                .map(([sku, quantity]) => ({
                                    sku, quantity
                                }));   // Формируем топ-10 товаров
    }); 
    return sellerStats.map(seller => ({
        seller_id: seller.id, // Строка, идентификатор продавца
        name: seller.name,// Строка, имя продавца
        revenue: +seller.revenue.toFixed(2),// Число с двумя знаками после точки, выручка продавца
        profit: +seller.profit.toFixed(2),// Число с двумя знаками после точки, прибыль продавца
        sales_count: seller.sales_count,// Целое число, количество продаж продавца
        top_products: seller.top_products.map(product => ({
            sku: product.sku,
            quantity: product.quantity
        })),// Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
        bonus: +seller.bonus.toFixed(2)// Число с двумя знаками после точки, бонус продавца
}))}; 
    // @TODO: Подготовка итоговой коллекции с нужными полями
