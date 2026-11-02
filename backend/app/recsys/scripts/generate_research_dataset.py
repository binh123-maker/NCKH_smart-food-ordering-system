import os
import json
import uuid
import random
import numpy as np
import pandas as pd
from pathlib import Path

# Set random seeds for reproducibility
np.random.seed(42)
random.seed(42)

DATA_RAW_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"
DATA_RAW_DIR.mkdir(parents=True, exist_ok=True)

# 1. 60 Disciplinary Food Dishes
FOODS_RAW = [
    # Cơm (10)
    {"name": "Cơm tấm sườn bì chả", "cat": "COM", "price": 55000, "cal": 680, "pro": 32, "fat": 24, "carb": 85, "tags": "traditional,vietnamese,pork", "ing": "gạo tấm, sườn heo nướng, bì heo, chả trứng, nước mắm tỏi ớt, mỡ hành"},
    {"name": "Cơm gà xối mỡ giòn", "cat": "COM", "price": 50000, "cal": 720, "pro": 35, "fat": 30, "carb": 78, "tags": "crispy,chicken,comfort", "ing": "cơm đỏ gà, đùi gà chiên giòn, dưa leo, cà chua, nước tương ớt"},
    {"name": "Cơm cá hồi sốt Teriyaki", "cat": "COM", "price": 95000, "cal": 540, "pro": 38, "fat": 18, "carb": 56, "tags": "healthy,high_protein,omega3,japanese", "ing": "cá hồi phi lê, sốt teriyaki, cơm trắng, súp lơ xanh, mè rang"},
    {"name": "Cơm bò lúc lắc khoai tây", "cat": "COM", "price": 75000, "cal": 640, "pro": 36, "fat": 22, "carb": 72, "tags": "beef,comfort,high_protein", "ing": "thịt bò thăn úc, ớt chuông, hành tây, cơm tỏi, bơ nhạt"},
    {"name": "Cơm rang dưa bò", "cat": "COM", "price": 45000, "cal": 610, "pro": 25, "fat": 20, "carb": 82, "tags": "traditional,street_food,budget", "ing": "cơm nguội rang giòn, thịt bò xào, dưa cải chua, tỏi phi"},
    {"name": "Cơm sườn nướng mật ong", "cat": "COM", "price": 60000, "cal": 650, "pro": 30, "fat": 22, "carb": 80, "tags": "pork,bbq,comfort", "ing": "sườn non, mật ong rừng, sả ớt, cơm tấm, rau xà lách"},
    {"name": "Cơm gạo lứt ức gà áp chảo", "cat": "COM", "price": 65000, "cal": 420, "pro": 42, "fat": 8, "carb": 48, "tags": "fitness,diet,high_protein,healthy,low_fat", "ing": "gạo lứt huyết rồng, ức gà phi lê, dầu oliu, măng tây, tiêu đen"},
    {"name": "Cơm thịt kho tàu trứng cút", "cat": "COM", "price": 45000, "cal": 670, "pro": 26, "fat": 32, "carb": 70, "tags": "traditional,home_cooking,comfort", "ing": "thịt ba chỉ, trứng cút, nước dừa tươi, cơm trắng, hành lá"},
    {"name": "Cơm chiên hải sản kim chi", "cat": "COM", "price": 60000, "cal": 590, "pro": 28, "fat": 18, "carb": 78, "tags": "seafood,spicy,korean_fusion", "ing": "tôm sú, mực tươi, kim chi cải thảo, cơm rang, rong biển khô"},
    {"name": "Cơm chay nấm hạt sen", "cat": "COM", "price": 45000, "cal": 380, "pro": 16, "fat": 8, "carb": 62, "tags": "vegetarian,vegan,healthy,plant_based", "ing": "nấm hương tươi, hạt sen Huế, đậu hũ chiên, gạo thơm, cà rốt"},

    # Phở & Bún (10)
    {"name": "Phở bò tái lăn Hà Nội", "cat": "PHO_BUN", "price": 60000, "cal": 520, "pro": 32, "fat": 16, "carb": 62, "tags": "traditional,soup,vietnamese,beef", "ing": "bánh phở tươi, thăn bò xào tỏi gừng, nước dùng xương bò hầm 12h, hành lá"},
    {"name": "Phở gà ta lá chanh", "cat": "PHO_BUN", "price": 55000, "cal": 460, "pro": 30, "fat": 12, "carb": 58, "tags": "traditional,chicken,low_fat,vietnamese", "ing": "thịt đùi gà ta xé, bánh phở, lá chanh non, nước hầm gà ngọt thanh"},
    {"name": "Bún chả Hà Nội nướng than hoa", "cat": "PHO_BUN", "price": 55000, "cal": 580, "pro": 28, "fat": 24, "carb": 64, "tags": "traditional,pork,vietnamese", "ing": "chả miếng thịt ba chỉ nướng than hoa, bún tươi, nước mắm đu đủ chua ngọt, rau sống"},
    {"name": "Bún bò Huế đặc biệt", "cat": "PHO_BUN", "price": 65000, "cal": 620, "pro": 34, "fat": 22, "carb": 70, "tags": "spicy,traditional,beef,soup", "ing": "bắp bò, giò heo, chả cua Huế, huyết, sả ruốc ớt cay, bún sợi to"},
    {"name": "Bún riêu cua bắp bò sườn sụn", "cat": "PHO_BUN", "price": 60000, "cal": 550, "pro": 30, "fat": 18, "carb": 66, "tags": "traditional,seafood,soup", "ing": "riêu cua đồng tươi, cà chua, sườn sụn giòn, bắp bò tái, đậu phụ rán, rau muống chẻ"},
    {"name": "Bún đậu mắm tôm thập cẩm", "cat": "PHO_BUN", "price": 65000, "cal": 710, "pro": 35, "fat": 34, "carb": 68, "tags": "traditional,street_food,comfort", "ing": "bún lá, đậu mơ rán giòn, chả cốm nướng, nem rán, thịt luộc, mắm tôm đánh chanh sủi bọt"},
    {"name": "Mì Quảng tôm thịt đậm đà", "cat": "PHO_BUN", "price": 50000, "cal": 510, "pro": 27, "fat": 16, "carb": 64, "tags": "traditional,central_vietnam,comfort", "ing": "sợi mì quảng nghệ, tôm ram mặn, thịt ba chỉ, trứng cút, bánh đa mè nướng, đậu phộng"},
    {"name": "Bánh canh cua biển đặc biệt", "cat": "PHO_BUN", "price": 75000, "cal": 530, "pro": 32, "fat": 15, "carb": 65, "tags": "seafood,soup,rich", "ing": "sợi bánh canh bột lọc dẻo, thịt cua biển bóc nõn, chả cá thát lát, nước dùng sền sệt"},
    {"name": "Hủ tiếu Nam Vang thập cẩm", "cat": "PHO_BUN", "price": 60000, "cal": 490, "pro": 28, "fat": 14, "carb": 62, "tags": "southern_vietnam,noodle_soup,pork", "ing": "hủ tiếu dai dai, tôm sú, thịt nạc dăm, tim heo, cật heo, tỏi phi thơm, giá đỗ"},
    {"name": "Phở cuốn thịt bò rau thơm", "cat": "PHO_BUN", "price": 55000, "cal": 410, "pro": 26, "fat": 10, "carb": 52, "tags": "healthy,fresh,low_calorie,vietnamese", "ing": "bánh phở bản to cuốn bắp bò xào tỏi, rau húng quế, xà lách, chấm mắm tỏi ớt"},

    # Món Healthy & Salad (10)
    {"name": "Salad ức gà áp chảo sốt mè rang", "cat": "HEALTHY_SALAD", "price": 65000, "cal": 360, "pro": 38, "fat": 11, "carb": 24, "tags": "fitness,diet,high_protein,healthy,low_carb", "ing": "ức gà nướng áp chảo, xà lách romaine, cà chua bi, ngô ngọt, sốt mè rang Kewpie"},
    {"name": "Salad cá hồi quả bơ sốt chanh leo", "cat": "HEALTHY_SALAD", "price": 89000, "cal": 430, "pro": 32, "fat": 22, "carb": 26, "tags": "healthy,high_protein,omega3,keto,low_carb", "ing": "cá hồi hun khói Na Uy, bơ sáp Đắk Lắk thái lát, rau rocket, sốt chanh leo mật ong"},
    {"name": "Bát Poke hải sản rong biển sốt Ponzu", "cat": "HEALTHY_SALAD", "price": 95000, "cal": 480, "pro": 35, "fat": 14, "carb": 52, "tags": "healthy,hawaiian,high_protein,fresh", "ing": "tôm luộc, cá ngừ đại dương tươi, rong biển wakame, đậu nành edamame, sốt ponzu"},
    {"name": "Salad bơ trứng luộc sốt sữa chua Hy Lạp", "cat": "HEALTHY_SALAD", "price": 55000, "cal": 320, "pro": 18, "fat": 16, "carb": 22, "tags": "vegetarian,healthy,diet,low_carb", "ing": "trứng gà lòng đào, quả bơ sáp, xà lách xoăn, sốt greek yogurt thì là"},
    {"name": "Salad rau củ ngũ sắc hạt chia", "cat": "HEALTHY_SALAD", "price": 45000, "cal": 220, "pro": 8, "fat": 6, "carb": 34, "tags": "vegan,vegetarian,diet,low_calorie,fiber", "ing": "bắp cải tím, cà rốt bào sợi, dưa leo baby, hạt chia hữu cơ, sốt giấm táo oliu"},
    {"name": "Ức gà hấp rau củ sốt gừng hành", "cat": "HEALTHY_SALAD", "price": 59000, "cal": 340, "pro": 40, "fat": 6, "carb": 28, "tags": "fitness,diet,high_protein,low_fat", "ing": "ức gà ta hấp mềm, bí ngòi, cà rốt baby, sốt gừng hành tươi, tiêu sọ"},
    {"name": "Cháo yến mạch tôm bằm nấm tuyết", "cat": "HEALTHY_SALAD", "price": 50000, "cal": 310, "pro": 24, "fat": 5, "carb": 42, "tags": "healthy,low_fat,diet,comfort", "ing": "yến mạch nguyên cám, tôm nõn băm nhỏ, nấm tuyết giòn, hành hoa, tiêu đen"},
    {"name": "Bò áp chảo măng tây sốt tiêu đen", "cat": "HEALTHY_SALAD", "price": 95000, "cal": 450, "pro": 44, "fat": 16, "carb": 22, "tags": "fitness,high_protein,beef,low_carb", "ing": "thịt bò thăn lưng áp chảo vừa chín tới, măng tây xanh giòn, nấm đùi gà, sốt tiêu đen"},
    {"name": "Salad đậu gà sốt bơ mè hạt dẻ", "cat": "HEALTHY_SALAD", "price": 50000, "cal": 350, "pro": 16, "fat": 12, "carb": 46, "tags": "vegan,vegetarian,fiber,plant_based", "ing": "đậu gà luộc mềm, ớt chuông nướng, rau mầm, hạt dẻ cười đập dập, sốt bơ mè tahini"},
    {"name": "Gỏi cuốn tôm thịt thanh mát", "cat": "HEALTHY_SALAD", "price": 45000, "cal": 280, "pro": 20, "fat": 6, "carb": 38, "tags": "healthy,low_calorie,vietnamese,fresh", "ing": "bánh tráng gạo, tôm luộc, nạc heo luộc, hẹ tươi, bún gạo, xà lách, chấm tương đen đậu phộng"},

    # Fast Food & Đồ Nhanh (10)
    {"name": "Burger bò phô mai đôi xông khói", "cat": "FASTFOOD", "price": 69000, "cal": 760, "pro": 38, "fat": 42, "carb": 56, "tags": "fast_food,beef,cheese,comfort", "ing": "bánh mì burger nướng bơ, 2 miếng thịt bò xay đập dẹp, 2 lát cheddar vàng, thịt xông khói giòn"},
    {"name": "Gà rán giòn cay sốt tương tỏi", "cat": "FASTFOOD", "price": 55000, "cal": 680, "pro": 34, "fat": 36, "carb": 52, "tags": "fast_food,chicken,crispy,spicy", "ing": "cánh và đùi gà tẩm bột chiên vàng rụm, lắc đều sốt tương tỏi cay đậm đà Hàn Quốc"},
    {"name": "Pizza phô mai xúc xích Pepperoni", "cat": "FASTFOOD", "price": 89000, "cal": 820, "pro": 30, "fat": 38, "carb": 88, "tags": "fast_food,pizza,cheese,comfort", "ing": "đế bánh pizza viền phô mai giòn xốp, sốt cà chua thảo mộc, xúc xích pepperoni cay, mozzarella kéo sợi"},
    {"name": "Khoai tây chiên giòn lắc phô mai", "cat": "FASTFOOD", "price": 35000, "cal": 460, "pro": 6, "fat": 24, "carb": 54, "tags": "fast_food,snack,budget", "ing": "khoai tây cắt sợi chiên ngập dầu giòn tan, phủ bột phô mai béo mặn ngọt"},
    {"name": "Bánh mì thập cẩm pate bơ thịt nguội", "cat": "FASTFOOD", "price": 30000, "cal": 480, "pro": 20, "fat": 18, "carb": 58, "tags": "fast_food,budget,traditional,street_food", "ing": "bánh mì giòn rụm, pate gan heo nhà làm, chả lụa, thịt nguội, dưa leo, ngò rí, ớt cay"},
    {"name": "Sandwich cá ngừ nướng phô mai tan chảy", "cat": "FASTFOOD", "price": 45000, "cal": 490, "pro": 26, "fat": 18, "carb": 52, "tags": "fast_food,fish,cheese,budget", "ing": "bánh mì sandwich nguyên cám nướng vàng, cá ngừ ngâm dầu sốt mayonnaise, phô mai cheddar"},
    {"name": "Mì Ý spaghetti sốt bò bằm cà chua", "cat": "FASTFOOD", "price": 60000, "cal": 620, "pro": 28, "fat": 20, "carb": 80, "tags": "pasta,italian,beef,comfort", "ing": "mì spaghetti luộc chín tới, sốt thịt bò bằm đậm đà cà chua Ý, rắc phô mai parmesan thơm lừng"},
    {"name": "Taco bò băm cay giòn rụm kiểu Mexico", "cat": "FASTFOOD", "price": 55000, "cal": 460, "pro": 24, "fat": 22, "carb": 42, "tags": "fast_food,mexican,spicy,beef", "ing": "vỏ bánh taco ngô giòn tan, thịt bò băm xào ớt bột cumin, sốt salsa chua cay, kem chua sour cream"},
    {"name": "Gà viên lắc sốt mật ong mù tạt", "cat": "FASTFOOD", "price": 42000, "cal": 510, "pro": 26, "fat": 24, "carb": 46, "tags": "fast_food,chicken,snack,crispy", "ing": "thịt ức gà cắt quân cờ tẩm bột xù chiên vàng, lắc sốt mật ong mù tạt vàng béo ngậy"},
    {"name": "Bánh mì que cay Hải Phòng đặc sản", "cat": "FASTFOOD", "price": 25000, "cal": 320, "pro": 10, "fat": 14, "carb": 38, "tags": "fast_food,budget,street_food,traditional", "ing": "bánh mì que thon dài nướng giòn thơm phức, kẹp pate gan ngậy béo, rưới chí chương ớt đỏ cay nồng"},

    # Đồ Uống (10)
    {"name": "Trà đào cam sả hạt chia tươi mát", "cat": "DOUONG", "price": 38000, "cal": 130, "pro": 1, "fat": 0, "carb": 32, "tags": "drink,tea,fresh,low_fat", "ing": "trà olong ủ lạnh, miếng đào giòn ngâm đường, cam vàng thái lát, sả tươi đập dập, hạt chia"},
    {"name": "Trà sữa trân châu đường đen trứ danh", "cat": "DOUONG", "price": 45000, "cal": 380, "pro": 4, "fat": 12, "carb": 65, "tags": "drink,sweet,tea,comfort", "ing": "trà đen đậm vị, sữa tươi thanh trùng DalatMilk, trân châu đen dẻo quánh sốt đường đen Đài Loan"},
    {"name": "Cà phê sữa đá Sài Gòn đậm đặc", "cat": "DOUONG", "price": 28000, "cal": 160, "pro": 3, "fat": 4, "carb": 28, "tags": "drink,coffee,traditional,energy", "ing": "cà phê robusta Buôn Ma Thuột pha phin truyền thống, sữa đặc Ngôi Sao Phương Nam, đá viên sạch"},
    {"name": "Nước ép cần tây dưa hấu thanh lọc cơ thể", "cat": "DOUONG", "price": 40000, "cal": 85, "pro": 2, "fat": 0, "carb": 20, "tags": "drink,diet,healthy,detox,low_calorie,vegan", "ing": "cần tây tươi ép chậm cùng dưa hấu đỏ mọng nước và một chút cốt chanh tươi, không thêm đường"},
    {"name": "Sinh tố bơ sáp dừa non béo ngậy", "cat": "DOUONG", "price": 48000, "cal": 360, "pro": 5, "fat": 20, "carb": 42, "tags": "drink,fruit,healthy_fat,smoothie", "ing": "bơ sáp Đắk Lắk xay nhuyễn cùng cơm dừa non bùi béo, sữa tươi, sữa chua và một ít đá xay"},
    {"name": "Trà xanh Matcha Latte kem Cheese béo", "cat": "DOUONG", "price": 48000, "cal": 290, "pro": 6, "fat": 10, "carb": 44, "tags": "drink,tea,japanese,comfort", "ing": "bột trà xanh matcha Uji Nhật Bản nguyên chất, sữa tươi nóng hoặc lạnh, phủ lớp kem mặn macchiato"},
    {"name": "Nước cam tươi mọng nước vắt nguyên chất", "cat": "DOUONG", "price": 35000, "cal": 110, "pro": 2, "fat": 0, "carb": 26, "tags": "drink,vitamin_c,healthy,vegan", "ing": "cam sành miền Tây vắt tay lấy nước cốt tươi nguyên tép cam, chút mật ong rừng dịu nhẹ"},
    {"name": "Nước dừa xiêm Bến Tre ngọt mát", "cat": "DOUONG", "price": 32000, "cal": 60, "pro": 1, "fat": 0, "carb": 15, "tags": "drink,detox,natural,healthy,vegan,low_calorie", "ing": "nước dừa xiêm xanh nguyên trái ngọt thanh tự nhiên giàu điện giải, kèm cơm dừa mềm nạo sợi"},
    {"name": "Sinh tố chuối yến mạch bơ đậu phộng Protein", "cat": "DOUONG", "price": 52000, "cal": 410, "pro": 28, "fat": 12, "carb": 48, "tags": "drink,fitness,high_protein,smoothie,energy", "ing": "chuối tây tiêu chín, bột yến mạch cán dẹt, bột whey protein isolate, bơ đậu phộng không đường, sữa hạnh nhân"},
    {"name": "Nước chanh leo tuyết mật ong bạc hà", "cat": "DOUONG", "price": 30000, "cal": 95, "pro": 1, "fat": 0, "carb": 23, "tags": "drink,fresh,vitamin_c,budget", "ing": "cốt chanh leo tươi chua thơm nồng nàn, mật ong hoa nhãn, lá bạc hà tươi vò dập, đá bào tuyết"},

    # Tráng Miệng (10)
    {"name": "Chè bưởi An Giang cùi giòn cốt dừa", "cat": "TRANGMIENG", "price": 30000, "cal": 280, "pro": 4, "fat": 8, "carb": 48, "tags": "dessert,sweet,traditional,vietnamese", "ing": "cùi bưởi da xanh sơ chế kỹ khử đắng giòn sần sật, đậu xanh đồ chín tơi, nước cốt dừa béo ngậy"},
    {"name": "Bánh flan caramel trứng sữa mềm mịn", "cat": "TRANGMIENG", "price": 22000, "cal": 190, "pro": 6, "fat": 7, "carb": 26, "tags": "dessert,budget,sweet,comfort", "ing": "trứng gà ta tươi, sữa đặc, sữa tươi không đường hấp cách thủy mềm mượt như lụa, lớp đường caramen đắng nhẹ"},
    {"name": "Sữa chua Hy Lạp hạt Granola và dâu tây", "cat": "TRANGMIENG", "price": 45000, "cal": 220, "pro": 14, "fat": 5, "carb": 30, "tags": "dessert,healthy,diet,fitness,high_protein", "ing": "sữa chua Hy Lạp tự ủ đặc quánh giàu đạm, hạt ngũ cốc nướng mật ong granola giòn rụm, dâu tây Đà Lạt xắt hạt lựu"},
    {"name": "Rau câu hoa quả tam sắc thanh mát", "cat": "TRANGMIENG", "price": 25000, "cal": 140, "pro": 2, "fat": 1, "carb": 32, "tags": "dessert,low_calorie,budget,vegan", "ing": "bột rau câu giòn agar, cốt dừa, nước ép thanh long đỏ và lá dứa xanh biếc tạo nên 3 tầng màu bắt mắt"},
    {"name": "Bánh chuối nướng cốt dừa truyền thống", "cat": "TRANGMIENG", "price": 30000, "cal": 310, "pro": 4, "fat": 9, "carb": 54, "tags": "dessert,traditional,sweet", "ing": "chuối sứ chín mùi ướp rượu rum thoang thoảng, bánh mì nướng mềm cùng nước cốt dừa và sữa đặc béo ngậy"},
    {"name": "Chè hạt sen long nhãn Hưng Yên", "cat": "TRANGMIENG", "price": 35000, "cal": 210, "pro": 4, "fat": 1, "carb": 48, "tags": "dessert,traditional,healthy,cooling", "ing": "hạt sen tươi nấu mềm bùi bọc trong từng múi long nhãn sấy dẻo ngọt thanh tao, nước đường phèn hoa bưởi"},
    {"name": "Panna Cotta vị dâu tây sốt chua ngọt", "cat": "TRANGMIENG", "price": 38000, "cal": 240, "pro": 4, "fat": 14, "carb": 26, "tags": "dessert,sweet,italian,comfort", "ing": "kem sữa tươi whipping cream béo ngậy kết đông cùng gelatin tự nhiên, phủ lớp sốt mứt dâu tây chua dịu"},
    {"name": "Kem dừa non Côn Đảo rắc đậu phộng", "cat": "TRANGMIENG", "price": 40000, "cal": 270, "pro": 3, "fat": 15, "carb": 32, "tags": "dessert,coconut,ice_cream,comfort", "ing": "viên kem dừa dẻo mịn đặt trong nửa trái dừa tươi, ăn kèm cơm dừa nạo mềm, đậu phộng rang giòn và sốt socola"},
    {"name": "Bánh crepe sầu riêng ngập kem béo", "cat": "TRANGMIENG", "price": 45000, "cal": 350, "pro": 5, "fat": 18, "carb": 42, "tags": "dessert,durian,rich,sweet", "ing": "vỏ bánh crepe lá dứa mỏng dai cuộn đầy ắp múi sầu riêng Ri6 thơm nức mũi và kem sữa béo ngậy"},
    {"name": "Tô trái cây tươi dầm sữa chua không đường", "cat": "TRANGMIENG", "price": 35000, "cal": 160, "pro": 5, "fat": 2, "carb": 32, "tags": "dessert,healthy,fruit,diet,low_fat", "ing": "dưa hấu, mít nghệ, xoài chín, thanh long trắng cắt quân cờ dầm cùng sữa chua men sống ít đường và đá bào"},
]

# Generate Food DataFrame
foods_list = []
for idx, f in enumerate(FOODS_RAW):
    f_id = f"food_{idx+1:03d}"
    slug = f["name"].lower().replace(" ", "-").replace("đ", "d").replace("ơ", "o")
    foods_list.append({
        "id": f_id,
        "name": f["name"],
        "category_id": f["cat"],
        "price": f["price"],
        "calories": f["cal"],
        "protein": f["pro"],
        "fat": f["fat"],
        "carbohydrates": f["carb"],
        "dietary_tags": f["tags"],
        "ingredients": f["ing"],
        "rating_average": round(random.uniform(4.0, 4.9), 1),
        "order_count": random.randint(30, 850),
    })

df_foods = pd.DataFrame(foods_list)
df_foods.to_csv(DATA_RAW_DIR / "foods.csv", index=False)
print(f"Generated {len(df_foods)} foods saved to {DATA_RAW_DIR / 'foods.csv'}")

# 2. 120 Users across 5 Realistic Personas
PERSONAS = [
    {"name": "GYM_FITNESS", "count": 25, "fav_cats": ["HEALTHY_SALAD", "COM"], "target_pro": 40, "target_cal": 650, "budget_max": 100000, "pref_tags": ["fitness", "high_protein", "omega3", "beef", "chicken"]},
    {"name": "WEIGHT_LOSS", "count": 25, "fav_cats": ["HEALTHY_SALAD", "DOUONG", "TRANGMIENG"], "target_pro": 20, "target_cal": 350, "budget_max": 80000, "pref_tags": ["diet", "low_calorie", "detox", "low_carb", "fiber"]},
    {"name": "BUDGET_STUDENT", "count": 25, "fav_cats": ["FASTFOOD", "COM", "DOUONG"], "target_pro": 25, "target_cal": 600, "budget_max": 45000, "pref_tags": ["budget", "street_food", "comfort"]},
    {"name": "TRADITIONAL_FOODIE", "count": 25, "fav_cats": ["PHO_BUN", "COM", "TRANGMIENG"], "target_pro": 30, "target_cal": 600, "budget_max": 90000, "pref_tags": ["traditional", "vietnamese", "beef", "soup"]},
    {"name": "VEGETARIAN", "count": 20, "fav_cats": ["HEALTHY_SALAD", "COM", "TRANGMIENG"], "target_pro": 15, "target_cal": 400, "budget_max": 70000, "pref_tags": ["vegetarian", "vegan", "plant_based"]},
]

users_list = []
user_counter = 1
user_persona_map = {}

for p in PERSONAS:
    for _ in range(p["count"]):
        u_id = f"user_{user_counter:03d}"
        users_list.append({
            "id": u_id,
            "email": f"user_{user_counter:03d}@example.com",
            "full_name": f"User {user_counter} ({p['name']})",
            "persona": p["name"],
            "preferred_categories": ",".join(p["fav_cats"]),
            "calorie_target": p["target_cal"],
            "protein_target": p["target_pro"],
            "budget_max": p["budget_max"],
            "dietary_preferences": ",".join(p["pref_tags"][:3]),
        })
        user_persona_map[u_id] = p
        user_counter += 1

df_users = pd.DataFrame(users_list)
df_users.to_csv(DATA_RAW_DIR / "users.csv", index=False)
print(f"Generated {len(df_users)} users saved to {DATA_RAW_DIR / 'users.csv'}")

# 3. Generate Realistic Interactions based on Persona Compatibility
interactions_list = []
for u_id, persona in user_persona_map.items():
    # Number of interactions per user: 15 to 30 to reflect realistic engagement
    n_interactions = random.randint(18, 28)
    
    # Calculate probability weight for each food based on persona match
    food_weights = []
    for _, f in df_foods.iterrows():
        weight = 1.0
        # Category bonus
        if f["category_id"] in persona["fav_cats"]:
            weight += 4.0
        
        # Tag bonus
        for tag in persona["pref_tags"]:
            if tag in f["dietary_tags"]:
                weight += 3.0
                
        # Calorie fitness bonus
        cal_diff = abs(f["calories"] - persona["target_cal"])
        if cal_diff < 150:
            weight += 2.0
            
        # Protein fitness bonus (especially for Gym)
        if persona["name"] == "GYM_FITNESS" and f["protein"] >= 30:
            weight += 4.0
            
        # Budget constraint penalty (for student)
        if f["price"] > persona["budget_max"]:
            weight *= 0.2
            
        # Vegetarian hard penalty
        if persona["name"] == "VEGETARIAN" and not any(v in f["dietary_tags"] for v in ["vegetarian", "vegan"]):
            weight = 0.01
            
        food_weights.append(weight)
        
    food_weights = np.array(food_weights)
    food_probs = food_weights / food_weights.sum()
    
    # Sample items without replacement
    chosen_food_indices = np.random.choice(len(df_foods), size=n_interactions, replace=False, p=food_probs)
    
    for f_idx in chosen_food_indices:
        food = df_foods.iloc[f_idx]
        
        # Determine affinity rating (1 to 5)
        affinity = 3.0
        if food["category_id"] in persona["fav_cats"]:
            affinity += 1.0
        for tag in persona["pref_tags"]:
            if tag in food["dietary_tags"]:
                affinity += 0.8
                break
        if persona["name"] == "GYM_FITNESS" and food["protein"] >= 32:
            affinity += 0.5
        if food["price"] <= persona["budget_max"] and persona["name"] == "BUDGET_STUDENT":
            affinity += 0.5
        if persona["name"] == "VEGETARIAN" and not any(v in food["dietary_tags"] for v in ["vegetarian", "vegan"]):
            affinity = 1.0
            
        # Add slight natural noise
        rating_score = min(5.0, max(1.0, round(affinity + random.gauss(0, 0.4), 1)))
        
        # Implicit interactions: orders, favorites, clicks
        order_count = int(np.random.poisson(max(1, rating_score - 1))) if rating_score >= 3.0 else 0
        is_favorite = 1 if (rating_score >= 4.2 and random.random() > 0.3) else 0
        click_count = random.randint(1, 15) + (order_count * 2)
        
        # Composite engagement score (Normalized 1.0 to 5.0)
        # Explicit rating + implicit boost
        composite_score = round(min(5.0, 0.65 * rating_score + 0.15 * min(5, order_count) + 0.10 * (5 if is_favorite else 0) + 0.10 * min(5, click_count / 3)), 2)
        
        interactions_list.append({
            "id": str(uuid.uuid4()),
            "user_id": u_id,
            "food_id": food["id"],
            "rating": rating_score,
            "order_count": order_count,
            "is_favorite": is_favorite,
            "click_count": click_count,
            "composite_score": composite_score,
        })

df_interactions = pd.DataFrame(interactions_list)
df_interactions.to_csv(DATA_RAW_DIR / "interactions.csv", index=False)
print(f"Generated {len(df_interactions)} interactions saved to {DATA_RAW_DIR / 'interactions.csv'}")

# Print Dataset Summary Stats
density = len(df_interactions) / (len(df_users) * len(df_foods)) * 100
print(f"Dataset Statistics:")
print(f"- Users: {len(df_users)}")
print(f"- Foods: {len(df_foods)}")
print(f"- Total Interactions: {len(df_interactions)}")
print(f"- Matrix Sparsity: {100 - density:.2f}% (Density: {density:.2f}%)")
print(f"- Average interactions per user: {len(df_interactions) / len(df_users):.1f}")

