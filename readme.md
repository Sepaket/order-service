redis db usage

- db 0: token seller
- db 1: token email activation
- db 2: tokrn admin
- db 3: token 3pl (ninja express)

seeder location usage
- please uncomment seed location file, for bisnis logic flow


Branch naming convention
- feature is for adding, refactoring or removing a feature
- bugfix is for fixing a bug
- hotfix is for changing code with a temporary solution and/or without following the usual process (usually because of an emergency)
- test is for experimenting outside of an issue/ticket

Category

A commit message should start with a category of change. You can pretty much use the following 4 categories for everything: feat, fix, refactor, and chore.

feat is for adding a new feature
fix is for fixing a bug
refactor is for changing code for peformance or convenience purpose (e.g. readibility)
chore is for everything else (writing documentation, formatting, adding tests, cleaning useless code etc.)
After the category, there should be a ":" announcing the commit description.

example :

git commit -m '<category: do something; do some other things>'


docker-compose -f docker-compose.production.yml up --build -d

docker-compose -f docker-compose.production.yml up --build -d